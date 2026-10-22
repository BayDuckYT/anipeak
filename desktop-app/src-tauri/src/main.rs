#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::{DateTime, Utc};
use http::{header, Response, StatusCode};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::Read,
    path::{Component, PathBuf},
    sync::Mutex,
    time::Duration,
};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_updater::UpdaterExt;
use uuid::Uuid;

const SITE: &str = "https://mahorapeak.com.tr";
const R2_HOST: &str = "pub-56389f4fc14f4af4b80a25136a28126e.r2.dev";
const MAX_PAGE_BYTES: usize = 25 * 1024 * 1024;
const MAX_CHAPTER_BYTES: usize = 500 * 1024 * 1024;

#[derive(Default)]
struct PendingUpdate(Mutex<Option<(tauri_plugin_updater::Update, Vec<u8>)>>);

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChapterMeta {
    id: String,
    series_title: String,
    series_slug: String,
    chapter_number: String,
    pages: usize,
    bytes: u64,
    downloaded_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DownloadPayload {
    series_title: String,
    series_slug: String,
    chapter_number: String,
    pages: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateInfo {
    version: String,
    current_version: String,
    notes: Option<String>,
}

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<Option<UpdateInfo>, String> {
    let updater = app.updater_builder().build().map_err(|e| e.to_string())?;
    let Some(update) = updater.check().await.map_err(|e| e.to_string())? else {
        return Ok(None);
    };
    Ok(Some(UpdateInfo {
        version: update.version,
        current_version: update.current_version,
        notes: update.body,
    }))
}

#[tauri::command]
async fn download_update(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    pending: tauri::State<'_, PendingUpdate>,
) -> Result<String, String> {
    let updater = app.updater_builder().build().map_err(|e| e.to_string())?;
    let Some(update) = updater.check().await.map_err(|e| e.to_string())? else {
        return Err("Uygulama zaten güncel.".into());
    };
    let version = update.version.clone();
    let mut downloaded = 0u64;
    let bytes = update
        .download(
            move |chunk, total| {
                downloaded = downloaded.saturating_add(chunk as u64);
                let _ = window.emit(
                    "mahorapeak-update-progress",
                    serde_json::json!({"chunk": downloaded, "total": total.unwrap_or(0)}),
                );
            },
            || {},
        )
        .await
        .map_err(|e| e.to_string())?;
    *pending.0.lock().map_err(|_| "Güncelleme durumu okunamadı.".to_owned())? = Some((update, bytes));
    let _ = app.emit("mahorapeak-update-downloaded", serde_json::json!({"version": version}));
    Ok(version)
}

#[tauri::command]
fn install_update(pending: tauri::State<'_, PendingUpdate>) -> Result<(), String> {
    let (update, bytes) = pending
        .0
        .lock()
        .map_err(|_| "Güncelleme durumu okunamadı.".to_owned())?
        .take()
        .ok_or_else(|| "Önce güncellemenin indirilmesi gerekiyor.".to_owned())?;
    update
        .restart_after_install(true)
        .install(bytes)
        .map_err(|e| e.to_string())
}

fn library_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("offline");
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    Ok(root)
}

fn safe_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 64 && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
}

fn safe_image_url(raw: &str) -> Result<url::Url, String> {
    let url =
        url::Url::parse(raw).map_err(|_| "Bölümde geçersiz görsel adresi var.".to_string())?;
    if url.scheme() != "https"
        || url.host_str() != Some(R2_HOST)
        || url.username() != ""
        || url.password().is_some()
    {
        return Err(
            "Güvenlik nedeniyle yalnızca MahoraPeak'in görsel deposu indirilebilir.".into(),
        );
    }
    Ok(url)
}

#[tauri::command]
async fn download_chapter(
    app: tauri::AppHandle,
    payload: DownloadPayload,
) -> Result<String, String> {
    if payload.series_title.trim().is_empty()
        || payload.series_title.len() > 180
        || payload.series_slug.len() > 140
    {
        return Err("Seri bilgisi geçersiz.".into());
    }
    if payload.pages.is_empty() || payload.pages.len() > 500 {
        return Err("Bölüm sayfa sayısı geçersiz (1–500 sayfa).".into());
    }
    let urls = payload
        .pages
        .iter()
        .map(|u| safe_image_url(u))
        .collect::<Result<Vec<_>, _>>()?;
    let root = library_dir(&app)?;
    let id = Uuid::new_v4().to_string();
    let staging = root.join(format!(".tmp-{id}"));
    fs::create_dir(&staging).map_err(|e| e.to_string())?;
    let client = Client::builder()
        .timeout(Duration::from_secs(45))
        .user_agent("MahoraPeakDesktop/1.3")
        .build()
        .map_err(|e| e.to_string())?;
    let mut total = 0usize;
    let result: Result<(), String> = async {
        for (index, url) in urls.iter().enumerate() {
            let response = client
                .get(url.clone())
                .send()
                .await
                .map_err(|e| format!("Sayfa {} indirilemedi: {e}", index + 1))?;
            if !response.status().is_success() {
                return Err(format!(
                    "Görsel sunucusu {} yanıtını verdi.",
                    response.status()
                ));
            }
            if let Some(n) = response.content_length() {
                if n as usize > MAX_PAGE_BYTES {
                    return Err(format!("Sayfa {} boyut sınırını aşıyor.", index + 1));
                }
            }
            let bytes = response.bytes().await.map_err(|e| e.to_string())?;
            if bytes.is_empty() || bytes.len() > MAX_PAGE_BYTES {
                return Err(format!("Sayfa {} boş veya çok büyük.", index + 1));
            }
            total = total
                .checked_add(bytes.len())
                .ok_or("Bölüm boyutu geçersiz.")?;
            if total > MAX_CHAPTER_BYTES {
                return Err("Bir bölüm için üst sınır 500 MB.".into());
            }
            fs::write(staging.join(format!("page-{:04}.img", index + 1)), &bytes)
                .map_err(|e| e.to_string())?;
        }
        let meta = ChapterMeta {
            id: id.clone(),
            series_title: payload.series_title.trim().to_string(),
            series_slug: payload.series_slug.clone(),
            chapter_number: payload.chapter_number.clone(),
            pages: urls.len(),
            bytes: total as u64,
            downloaded_at: Utc::now(),
        };
        fs::write(
            staging.join("chapter.json"),
            serde_json::to_vec_pretty(&meta).map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())?;
        fs::rename(&staging, root.join(&id)).map_err(|e| e.to_string())?;
        Ok(())
    }
    .await;
    if let Err(error) = result {
        let _ = fs::remove_dir_all(&staging);
        return Err(error);
    }
    Ok(format!(
        "{} · Bölüm {} indirildi ({} sayfa).",
        payload.series_title,
        payload.chapter_number,
        urls.len()
    ))
}

#[tauri::command]
fn list_offline_chapters(app: tauri::AppHandle) -> Result<Vec<ChapterMeta>, String> {
    let root = library_dir(&app)?;
    let mut chapters = Vec::new();
    for entry in fs::read_dir(root).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        if !path.is_dir() {
            continue;
        }
        if let Ok(data) = fs::read(path.join("chapter.json")) {
            if let Ok(meta) = serde_json::from_slice::<ChapterMeta>(&data) {
                chapters.push(meta);
            }
        }
    }
    chapters.sort_by(|a, b| b.downloaded_at.cmp(&a.downloaded_at));
    Ok(chapters)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ReaderData {
    series_title: String,
    chapter_number: String,
    pages: Vec<String>,
}

#[tauri::command]
fn read_offline_chapter(app: tauri::AppHandle, id: String) -> Result<ReaderData, String> {
    if !safe_id(&id) {
        return Err("Bölüm kimliği geçersiz.".into());
    }
    let dir = library_dir(&app)?.join(&id);
    let data = fs::read(dir.join("chapter.json"))
        .map_err(|_| "İndirilen bölüm bulunamadı.".to_string())?;
    let meta: ChapterMeta = serde_json::from_slice(&data).map_err(|e| e.to_string())?;
    let pages = (1..=meta.pages)
        .map(|n| format!("http://offline.localhost/{id}/page-{n:04}.img"))
        .collect();
    Ok(ReaderData {
        series_title: meta.series_title,
        chapter_number: meta.chapter_number,
        pages,
    })
}

#[tauri::command]
fn delete_offline_chapter(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if !safe_id(&id) {
        return Err("Bölüm kimliği geçersiz.".into());
    }
    let path = library_dir(&app)?.join(&id);
    if !path.join("chapter.json").is_file() {
        return Err("İndirilen bölüm bulunamadı.".into());
    }
    fs::remove_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_site(window: tauri::WebviewWindow) -> Result<(), String> {
    window
        .navigate(SITE.parse().map_err(|e: url::ParseError| e.to_string())?)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_home(window: tauri::WebviewWindow) -> Result<(), String> {
    window
        .navigate(SITE.parse().map_err(|e: url::ParseError| e.to_string())?)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_offline_library(window: tauri::WebviewWindow) -> Result<(), String> {
    window
        .navigate("http://tauri.localhost/offline.html".parse().unwrap())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_fullscreen(window: tauri::WebviewWindow) -> Result<bool, String> {
    let enabled = !window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(enabled).map_err(|e| e.to_string())?;
    Ok(enabled)
}

#[tauri::command]
fn window_minimize(window: tauri::WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn window_toggle_maximize(window: tauri::WebviewWindow) -> Result<(), String> {
    if window.is_maximized().map_err(|e| e.to_string())? {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn window_close(window: tauri::WebviewWindow) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn window_start_dragging(window: tauri::WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

fn offline_response(app: &tauri::AppHandle, path: &str) -> Response<Vec<u8>> {
    let parsed = url::Url::parse(path).ok();
    let segments: Vec<_> = parsed
        .as_ref()
        .and_then(|u| u.path_segments())
        .map(|s| s.collect())
        .unwrap_or_default();
    let fail = |status| Response::builder().status(status).body(Vec::new()).unwrap();
    if segments.len() != 2 || !safe_id(segments[0]) {
        return fail(StatusCode::NOT_FOUND);
    }
    let file = segments[1];
    if file.contains('/')
        || file.contains('\\')
        || file.contains("..")
        || !file.starts_with("page-")
        || !file.ends_with(".img")
    {
        return fail(StatusCode::FORBIDDEN);
    }
    let Ok(root) = library_dir(app) else {
        return fail(StatusCode::INTERNAL_SERVER_ERROR);
    };
    let target = root.join(segments[0]).join(file);
    if target
        .components()
        .any(|c| matches!(c, Component::ParentDir))
    {
        return fail(StatusCode::FORBIDDEN);
    }
    let Ok(mut file_handle) = fs::File::open(target) else {
        return fail(StatusCode::NOT_FOUND);
    };
    let Ok(meta) = file_handle.metadata() else {
        return fail(StatusCode::NOT_FOUND);
    };
    if meta.len() > MAX_PAGE_BYTES as u64 {
        return fail(StatusCode::PAYLOAD_TOO_LARGE);
    }
    let mut bytes = Vec::with_capacity(meta.len() as usize);
    if file_handle.read_to_end(&mut bytes).is_err() {
        return fail(StatusCode::INTERNAL_SERVER_ERROR);
    }
    let mime = if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        "image/jpeg"
    } else if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        "image/png"
    } else if bytes.starts_with(b"GIF8") {
        "image/gif"
    } else if bytes.len() >= 12 && &bytes[8..12] == b"WEBP" {
        "image/webp"
    } else if bytes.len() >= 12
        && &bytes[4..8] == b"ftyp"
        && matches!(&bytes[8..12], b"avif" | b"avis")
    {
        "image/avif"
    } else {
        "application/octet-stream"
    };
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, mime)
        .header(header::CONTENT_LENGTH, bytes.len())
        .header(
            header::CACHE_CONTROL,
            "private, max-age=31536000, immutable",
        )
        .body(bytes)
        .unwrap()
}

const SITE_SCRIPT: &str = include_str!("../inject.js");

fn main() {
    let result = tauri::Builder::default()
        .manage(PendingUpdate::default())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .register_uri_scheme_protocol("offline", |ctx, request| {
            offline_response(ctx.app_handle(), &request.uri().to_string())
        })
        .invoke_handler(tauri::generate_handler![
            download_chapter,
            check_for_updates,
            download_update,
            install_update,
            list_offline_chapters,
            read_offline_chapter,
            delete_offline_chapter,
            open_site,
            open_home,
            open_offline_library,
            toggle_fullscreen,
            window_minimize,
            window_toggle_maximize,
            window_close,
            window_start_dragging
        ])
        .setup(|app| {
            let url = WebviewUrl::External(SITE.parse().unwrap());
            WebviewWindowBuilder::new(app, "main", url)
                .title("MahoraPeak Desktop")
                .inner_size(1440.0, 900.0)
                .min_inner_size(960.0, 640.0)
                .decorations(false)
                .initialization_script(SITE_SCRIPT)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!());

    if let Err(error) = result {
        let message = format!("MahoraPeak Desktop startup error: {error:#}");
        let _ = fs::write(
            std::env::temp_dir().join("mahorapeak-desktop-startup.log"),
            message,
        );
    }
}
