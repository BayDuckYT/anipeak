fn main() {
    const APP_COMMANDS: &[&str] = &[
        "download_chapter",
        "check_for_updates",
        "download_update",
        "install_update",
        "list_offline_chapters",
        "read_offline_chapter",
        "delete_offline_chapter",
        "open_site",
        "open_home",
        "open_offline_library",
        "toggle_fullscreen",
        "window_minimize",
        "window_toggle_maximize",
        "window_close",
        "window_start_dragging",
    ];
    let attributes = tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(APP_COMMANDS),
    );
    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}
