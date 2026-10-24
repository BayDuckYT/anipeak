package com.mahorapeak.manga

import android.annotation.SuppressLint
import android.Manifest
import android.app.DownloadManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color as AndroidColor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.view.KeyEvent
import android.webkit.CookieManager
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.URLUtil
import android.os.Environment
import android.widget.Toast
import android.content.ActivityNotFoundException
import android.provider.Settings
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.LibraryBooks
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.FloatingActionButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import coil.compose.AsyncImage
import androidx.core.view.WindowCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.WebMessageCompat
import androidx.webkit.WebViewCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import com.mahorapeak.manga.ui.theme.BackgroundDark
import com.mahorapeak.manga.ui.theme.MahoraPeakTheme
import com.mahorapeak.manga.ui.theme.PurpleAccent
import com.mahorapeak.manga.ui.theme.PurplePrimary
import com.mahorapeak.manga.BuildConfig
import dagger.hilt.android.AndroidEntryPoint
import org.json.JSONObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

private data class OfflineFile(val id: Long, val title: String, val sizeLabel: String, val uri: Uri?)
private data class OfflineChapter(
    val id: String,
    val seriesTitle: String,
    val chapterTitle: String,
    val chapterNumber: Double,
    val directory: String,
    val pages: List<String>,
    val sizeBytes: Long
)
private sealed interface ChapterDownloadState {
    data class Downloading(val series: String, val chapter: String, val current: Int, val total: Int) : ChapterDownloadState
    data class Error(val message: String) : ChapterDownloadState
}
private data class AndroidUpdate(val version: String, val url: String, val notes: String, val sha256: String?)
private sealed interface UpdateUiState {
    data object Hidden : UpdateUiState
    data class Available(val update: AndroidUpdate) : UpdateUiState
    data class Downloading(val update: AndroidUpdate, val progress: Int) : UpdateUiState
    data class Error(val message: String) : UpdateUiState
}

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private var webView: WebView? = null
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var updateState by mutableStateOf<UpdateUiState>(UpdateUiState.Hidden)
    private var downloadedUpdate: File? = null
    private var installSettingsOpened = false
    private var isReaderPage by mutableStateOf(false)
    private var offlineHubOpen by mutableStateOf(false)
    private var offlineReader by mutableStateOf<OfflineChapter?>(null)
    private var offlineChapters by mutableStateOf(emptyList<OfflineChapter>())
    private var chapterDownloadState by mutableStateOf<ChapterDownloadState?>(null)
    private val notificationPermissionRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        Toast.makeText(this, if (granted) "Telefon bildirimleri açıldı" else "Bildirim izni verilmedi", Toast.LENGTH_SHORT).show()
    }

    private fun loadOfflineFiles(): List<OfflineFile> {
        val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val ids = getSharedPreferences("offline_downloads", MODE_PRIVATE)
            .getStringSet("ids", emptySet()).orEmpty().mapNotNull { it.toLongOrNull() }
        return ids.mapNotNull { id ->
            val cursor = manager.query(DownloadManager.Query().setFilterById(id)) ?: return@mapNotNull null
            cursor.use {
                if (!it.moveToFirst()) return@mapNotNull null
                val status = it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                if (status != DownloadManager.STATUS_SUCCESSFUL) return@mapNotNull null
                val title = it.getString(it.getColumnIndexOrThrow(DownloadManager.COLUMN_TITLE)) ?: "İndirilen bölüm"
                val bytes = it.getLong(it.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                val size = if (bytes > 0) String.format("%.1f MB", bytes / 1024f / 1024f) else "İndirildi"
                OfflineFile(id, title, size, manager.getUriForDownloadedFile(id))
            }
        }.reversed()
    }

    private fun removeOfflineFile(file: OfflineFile) {
        runCatching { (getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).remove(file.id) }
        val prefs = getSharedPreferences("offline_downloads", MODE_PRIVATE)
        prefs.edit().putStringSet("ids", prefs.getStringSet("ids", emptySet()).orEmpty() - file.id.toString()).apply()
    }

    private fun persistOfflineChapters(chapters: List<OfflineChapter>) {
        val json = org.json.JSONArray()
        chapters.forEach { chapter ->
            json.put(JSONObject()
                .put("id", chapter.id).put("seriesTitle", chapter.seriesTitle).put("chapterTitle", chapter.chapterTitle)
                .put("chapterNumber", chapter.chapterNumber).put("directory", chapter.directory)
                .put("pages", org.json.JSONArray(chapter.pages)).put("sizeBytes", chapter.sizeBytes))
        }
        getSharedPreferences("offline_chapters", MODE_PRIVATE).edit().putString("items", json.toString()).apply()
        offlineChapters = chapters.sortedWith(compareBy<OfflineChapter> { it.seriesTitle.lowercase() }.thenBy { it.chapterNumber })
    }

    private fun loadOfflineChapters() {
        val raw = getSharedPreferences("offline_chapters", MODE_PRIVATE).getString("items", "[]") ?: "[]"
        val parsed = runCatching {
            val array = org.json.JSONArray(raw)
            (0 until array.length()).mapNotNull { index ->
                val item = array.getJSONObject(index)
                val directory = item.getString("directory")
                val folder = File(filesDir, directory)
                val pagesJson = item.optJSONArray("pages") ?: return@mapNotNull null
                val pages = (0 until pagesJson.length()).map { pagesJson.getString(it) }.filter { File(folder, it).isFile }
                if (pages.isEmpty()) return@mapNotNull null
                OfflineChapter(item.getString("id"), item.getString("seriesTitle"), item.getString("chapterTitle"),
                    item.optDouble("chapterNumber", 0.0), directory, pages, item.optLong("sizeBytes"))
            }
        }.getOrDefault(emptyList())
        offlineChapters = parsed.sortedWith(compareBy<OfflineChapter> { it.seriesTitle.lowercase() }.thenBy { it.chapterNumber })
        persistOfflineChapters(parsed)
    }

    private fun deleteOfflineChapter(chapter: OfflineChapter) {
        runCatching { File(filesDir, chapter.directory).deleteRecursively() }
        persistOfflineChapters(offlineChapters.filterNot { it.id == chapter.id })
    }

    private fun downloadOfflineChapter(payload: JSONObject) {
        val slug = safeFilePart(payload.optString("seriesSlug"))
        val chapterSlug = safeFilePart(payload.optString("chapterSlug"))
        val series = payload.optString("seriesTitle").take(120).ifBlank { slug.replace('-', ' ').replaceFirstChar { it.uppercase() } }
        val number = payload.optDouble("chapterNumber", 0.0)
        val title = payload.optString("chapterTitle").take(100).ifBlank { "Bölüm ${number.toString().removeSuffix(".0")}" }
        val pagesJson = payload.optJSONArray("pages") ?: run { chapterDownloadState = ChapterDownloadState.Error("Bölüm sayfaları bulunamadı."); return }
        val urls = (0 until pagesJson.length()).mapNotNull { pagesJson.optString(it).takeIf { value -> value.isNotBlank() } }
            .filter { runCatching { URL(it).protocol == "https" }.getOrDefault(false) }.distinct().take(300)
        if (slug.isBlank() || chapterSlug.isBlank() || urls.isEmpty()) {
            chapterDownloadState = ChapterDownloadState.Error("Bu bölümde indirilebilir sayfa bulunamadı.")
            return
        }
        lifecycleScope.launch {
            chapterDownloadState = ChapterDownloadState.Downloading(series, title, 0, urls.size)
            val result = withContext(Dispatchers.IO) {
                runCatching {
                    val id = "$slug-$chapterSlug"
                    val directory = "offline-chapters/$id"
                    val folder = File(filesDir, directory)
                    val tempFolder = File(filesDir, "offline-chapters/.$id.partial")
                    tempFolder.deleteRecursively()
                    if (!tempFolder.mkdirs()) error("Cihazda indirme alanı açılamadı.")
                    var totalBytes = 0L
                    urls.forEachIndexed { index, imageUrl ->
                        val connection = (URL(imageUrl).openConnection() as HttpURLConnection).apply {
                            connectTimeout = 12000
                            readTimeout = 25000
                            setRequestProperty("User-Agent", webView?.settings?.userAgentString ?: "MahoraPeakAndroidApp/1.0")
                            setRequestProperty("Referer", "https://mahorapeak.com.tr/")
                            CookieManager.getInstance().getCookie(imageUrl)?.let { setRequestProperty("Cookie", it) }
                        }
                        try {
                            if (connection.responseCode !in 200..299) error("Sayfa ${index + 1} indirilemedi (${connection.responseCode}).")
                            val mime = connection.contentType?.substringBefore(';')
                            val ext = android.webkit.MimeTypeMap.getSingleton().getExtensionFromMimeType(mime)
                                ?: URL(imageUrl).path.substringAfterLast('.', "jpg").takeIf { it.length in 2..5 } ?: "jpg"
                            val pageFile = File(tempFolder, "%03d.%s".format(index + 1, ext))
                            connection.inputStream.use { input -> pageFile.outputStream().use { output ->
                                val buffer = ByteArray(32 * 1024)
                                while (true) {
                                    val count = input.read(buffer)
                                    if (count < 0) break
                                    totalBytes += count
                                    if (totalBytes > 400L * 1024L * 1024L) error("Bölüm indirme sınırını aştı (400 MB).")
                                    output.write(buffer, 0, count)
                                }
                            } }
                        } finally { connection.disconnect() }
                        withContext(Dispatchers.Main) {
                            chapterDownloadState = ChapterDownloadState.Downloading(series, title, index + 1, urls.size)
                        }
                    }
                    folder.deleteRecursively()
                    if (!tempFolder.renameTo(folder)) error("İndirilen bölüm kaydedilemedi.")
                    val item = OfflineChapter(id, series, title, number, directory, folder.listFiles()?.filter { it.isFile }?.sortedBy { it.name }?.map { it.name }.orEmpty(), totalBytes)
                    item
                }
            }
            result.onSuccess { chapter ->
                persistOfflineChapters((offlineChapters.filterNot { it.id == chapter.id } + chapter))
                chapterDownloadState = null
                Toast.makeText(this@MainActivity, "${chapter.chapterTitle} çevrimdışı kütüphaneye eklendi", Toast.LENGTH_LONG).show()
            }.onFailure { error ->
                chapterDownloadState = ChapterDownloadState.Error(error.message ?: "Bölüm indirilemedi.")
            }
        }
    }

    private fun openExternalOfflineFile(file: OfflineFile) {
        file.uri?.let { uri -> runCatching {
            val type = contentResolver.getType(uri) ?: "application/octet-stream"
            startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, type).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION))
        }.onFailure { Toast.makeText(this, "Bu dosya için açacak uygulama bulunamadı", Toast.LENGTH_SHORT).show() } }
    }

    private fun checkForAndroidUpdate() {
        lifecycleScope.launch {
            val update = withContext(Dispatchers.IO) {
                runCatching {
                    val connection = (URL(ANDROID_RELEASES_URL).openConnection() as HttpURLConnection).apply {
                        connectTimeout = 8000
                        readTimeout = 10000
                        setRequestProperty("Accept", "application/vnd.github+json")
                        setRequestProperty("User-Agent", "MahoraPeak-Android")
                    }
                    try {
                        if (connection.responseCode !in 200..299) error("GitHub ${connection.responseCode}")
                        val releases = org.json.JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
                        (0 until releases.length()).asSequence().map { releases.getJSONObject(it) }
                            .firstNotNullOfOrNull { release ->
                                val tag = release.optString("tag_name")
                                if (release.optBoolean("draft") || release.optBoolean("prerelease") || !tag.startsWith("android-v")) return@firstNotNullOfOrNull null
                                val version = tag.removePrefix("android-v")
                                if (compareVersions(version, BuildConfig.VERSION_NAME) <= 0) return@firstNotNullOfOrNull null
                                val assets = release.optJSONArray("assets") ?: return@firstNotNullOfOrNull null
                                val apk = (0 until assets.length()).asSequence().map { assets.getJSONObject(it) }
                                    .firstOrNull { it.optString("name") == ANDROID_APK_ASSET }
                                    ?: return@firstNotNullOfOrNull null
                                AndroidUpdate(version, apk.optString("browser_download_url"), release.optString("body").take(1200), apk.optString("digest").removePrefix("sha256:").takeIf { it.matches(Regex("(?i)[0-9a-f]{64}")) })
                            }
                    } finally { connection.disconnect() }
                }.getOrNull()
            }
            if (update != null) updateState = UpdateUiState.Available(update)
        }
    }

    private fun downloadAndInstall(update: AndroidUpdate) {
        lifecycleScope.launch {
            updateState = UpdateUiState.Downloading(update, 0)
            val result = withContext(Dispatchers.IO) {
                runCatching {
                    val connection = (URL(update.url).openConnection() as HttpURLConnection).apply {
                        connectTimeout = 12000
                        readTimeout = 30000
                        setRequestProperty("User-Agent", "MahoraPeak-Android")
                    }
                    try {
                        if (connection.responseCode !in 200..299) error("APK indirilemedi (${connection.responseCode})")
                        val total = connection.contentLengthLong
                        val apk = File(cacheDir, "mahorapeak-android-update.apk")
                        val digest = MessageDigest.getInstance("SHA-256")
                        connection.inputStream.use { input -> apk.outputStream().use { output ->
                            val buffer = ByteArray(64 * 1024)
                            var received = 0L
                            while (true) {
                                val count = input.read(buffer)
                                if (count < 0) break
                                output.write(buffer, 0, count)
                                digest.update(buffer, 0, count)
                                received += count
                                if (total > 0) {
                                    val percent = (received * 100 / total).toInt()
                                    runOnUiThread { updateState = UpdateUiState.Downloading(update, percent) }
                                }
                            }
                        } }
                        if (update.sha256 != null && !digest.digest().joinToString("") { "%02x".format(it) }.equals(update.sha256, true)) {
                            apk.delete()
                            error("İndirilen APK doğrulanamadı")
                        }
                        apk
                    } finally { connection.disconnect() }
                }
            }
            result.onSuccess { apk ->
                downloadedUpdate = apk
                installDownloadedUpdate()
            }.onFailure { error ->
                updateState = UpdateUiState.Error(error.message ?: "Güncelleme indirilemedi")
            }
        }
    }

    private fun installDownloadedUpdate() {
        val apk = downloadedUpdate ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !packageManager.canRequestPackageInstalls()) {
            if (!installSettingsOpened) {
                installSettingsOpened = true
                Toast.makeText(this, "Güncellemeyi kurmak için MahoraPeak'e izin ver", Toast.LENGTH_LONG).show()
                startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:$packageName")))
            }
            return
        }
        installSettingsOpened = false
        runCatching {
            val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", apk)
            startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK))
            updateState = UpdateUiState.Hidden
        }.onFailure { updateState = UpdateUiState.Error("Kurulum açılamadı: ${it.message ?: "Bilinmeyen hata"}") }
    }

    override fun onResume() {
        super.onResume()
        if (installSettingsOpened && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && packageManager.canRequestPackageInstalls()) installDownloadedUpdate()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val isVolumeKey = event.keyCode == KeyEvent.KEYCODE_VOLUME_UP || event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN
        val volumeNavigationEnabled = getSharedPreferences("reader_preferences", MODE_PRIVATE)
            .getBoolean("volume_navigation", true)
        if (isVolumeKey && isReaderPage && volumeNavigationEnabled) {
            if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                val step = if (event.keyCode == KeyEvent.KEYCODE_VOLUME_UP) 1 else -1
                webView?.evaluateJavascript("window.__mahoraReaderControls && window.__mahoraReaderControls.step($step)", null)
            }
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val callback = fileChooserCallback ?: return@registerForActivityResult
        fileChooserCallback = null
        callback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        loadOfflineChapters()
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = AndroidColor.rgb(10, 8, 16)
        window.navigationBarColor = AndroidColor.rgb(10, 8, 16)
        createNotificationChannel()

        var reloadPage: (() -> Unit)? = null
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (offlineReader != null) { offlineReader = null; return }
                if (offlineHubOpen) { offlineHubOpen = false; return }
                val currentWebView = webView
                if (currentWebView?.canGoBack() == true) currentWebView.goBack() else finish()
            }
        })

        setContent {
            MahoraPeakTheme {
                val systemUiController = rememberSystemUiController()
                SideEffect {
                    systemUiController.setStatusBarColor(BackgroundDark, darkIcons = false)
                    systemUiController.setNavigationBarColor(BackgroundDark, darkIcons = false)
                }

                var isLoading by remember { mutableStateOf(true) }
                var hasPageError by remember { mutableStateOf(false) }
                var pageProgress by remember { mutableIntStateOf(0) }
                var offlineFiles by remember { mutableStateOf(emptyList<OfflineFile>()) }

                Box(Modifier.fillMaxSize().background(BackgroundDark)) {
                    AndroidView(
                        factory = { context ->
                            val swipeRefresh = SwipeRefreshLayout(context).apply {
                                setColorSchemeColors(AndroidColor.rgb(192, 132, 252), AndroidColor.rgb(124, 58, 237))
                                setProgressBackgroundColorSchemeColor(AndroidColor.rgb(24, 20, 34))
                                setOnRefreshListener { webView?.reload() ?: setRefreshing(false) }
                            }
                            val browser = WebView(context).apply {
                                webView = this
                                setBackgroundColor(AndroidColor.rgb(10, 8, 16))
                                settings.apply {
                                    javaScriptEnabled = true
                                    domStorageEnabled = true
                                    useWideViewPort = true
                                    loadWithOverviewMode = true
                                    cacheMode = WebSettings.LOAD_DEFAULT
                                    userAgentString = "$userAgentString MahoraPeakAndroidApp/1.0"
                                    mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                                    setSupportZoom(false)
                                    builtInZoomControls = false
                                    displayZoomControls = false
                                    allowFileAccess = false
                                    allowContentAccess = true
                                    javaScriptCanOpenWindowsAutomatically = false
                                    setSupportMultipleWindows(false)
                                    mediaPlaybackRequiresUserGesture = true
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) safeBrowsingEnabled = true
                                }
                                CookieManager.getInstance().setAcceptCookie(true)
                                CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
                                installNativeBridge(this)

                                webViewClient = object : WebViewClient() {
                                    override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                                        hasPageError = false
                                        isLoading = true
                                        pageProgress = 0
                                        isReaderPage = isReaderUrl(url)
                                        window.decorView.keepScreenOn = isReaderPage
                                    }

                                    override fun onPageFinished(view: WebView?, url: String?) {
                                        isLoading = false
                                        hasPageError = false
                                        swipeRefresh.isRefreshing = false
                                        isReaderPage = isReaderUrl(url)
                                        window.decorView.keepScreenOn = isReaderPage
                                        view?.evaluateJavascript(MOBILE_APP_SCRIPT, null)
                                    }

                                    override fun onReceivedError(
                                        view: WebView?,
                                        request: WebResourceRequest?,
                                        error: WebResourceError?
                                    ) {
                                        if (request?.isForMainFrame == true) {
                                            isLoading = false
                                            hasPageError = true
                                            offlineFiles = loadOfflineFiles()
                                            swipeRefresh.isRefreshing = false
                                        }
                                    }

                                    override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: android.net.http.SslError?) {
                                        handler?.cancel()
                                        isLoading = false
                                        hasPageError = true
                                        swipeRefresh.isRefreshing = false
                                    }

                                }

                                webChromeClient = object : WebChromeClient() {
                                    override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                        pageProgress = newProgress
                                        if (newProgress >= 100) isLoading = false
                                    }

                                    override fun onShowFileChooser(
                                        view: WebView?,
                                        filePathCallback: ValueCallback<Array<Uri>>?,
                                        fileChooserParams: FileChooserParams?
                                    ): Boolean {
                                        fileChooserCallback?.onReceiveValue(null)
                                        fileChooserCallback = filePathCallback
                                        return try {
                                            filePicker.launch(fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                                                addCategory(Intent.CATEGORY_OPENABLE)
                                                type = "image/*"
                                            })
                                            true
                                        } catch (_: Exception) {
                                            fileChooserCallback?.onReceiveValue(null)
                                            fileChooserCallback = null
                                            false
                                        }
                                    }
                                }

                                setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
                                    runCatching {
                                        val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
                                        val request = DownloadManager.Request(Uri.parse(url)).apply {
                                            setTitle(fileName)
                                            setMimeType(mimeType)
                                            addRequestHeader("User-Agent", userAgent)
                                            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                                            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "MahoraPeak/$fileName")
                                        }
                                        val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                                        val id = manager.enqueue(request)
                                        val prefs = getSharedPreferences("offline_downloads", MODE_PRIVATE)
                                        val ids = prefs.getStringSet("ids", emptySet()).orEmpty() + id.toString()
                                        prefs.edit().putStringSet("ids", ids.toSet()).apply()
                                        runOnUiThread { offlineFiles = loadOfflineFiles() }
                                        Toast.makeText(this@MainActivity, "İndirme başladı · Bildirimlerden takip edebilirsin", Toast.LENGTH_LONG).show()
                                    }.onFailure {
                                        Toast.makeText(this@MainActivity, "Bu içerik indirilemedi", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            }

                            swipeRefresh.addView(browser, ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            ))
                            reloadPage = { browser.reload() }
                            val restored = savedInstanceState?.getBundle(WEB_VIEW_STATE)?.let { browser.restoreState(it) }
                            if (restored == null) browser.loadUrl(HOME_URL)
                            swipeRefresh
                        },
                        modifier = Modifier.fillMaxSize()
                    )

                    if (hasPageError) {
                        NetworkErrorScreen(
                            files = offlineFiles,
                            chapters = offlineChapters,
                            onDelete = { file -> removeOfflineFile(file); offlineFiles = loadOfflineFiles() },
                            onDeleteChapter = ::deleteOfflineChapter,
                            onOpenChapter = { offlineReader = it },
                            onRetry = {
                                hasPageError = false
                                isLoading = true
                                reloadPage?.invoke()
                            },
                            onOpen = ::openExternalOfflineFile
                        )
                    } else {
                        AnimatedVisibility(
                            visible = isLoading,
                            enter = androidx.compose.animation.fadeIn(tween(180)),
                            exit = androidx.compose.animation.fadeOut(tween(260, easing = FastOutSlowInEasing))
                        ) {
                            LaunchScreen(progress = pageProgress)
                        }
                    }
                    if (!hasPageError && offlineHubOpen) {
                        NetworkErrorScreen(
                            files = offlineFiles,
                            chapters = offlineChapters,
                            onDelete = { file -> removeOfflineFile(file); offlineFiles = loadOfflineFiles() },
                            onDeleteChapter = ::deleteOfflineChapter,
                            onOpenChapter = { offlineReader = it },
                            onRetry = { offlineHubOpen = false },
                            onOpen = ::openExternalOfflineFile,
                            onClose = { offlineHubOpen = false }
                        )
                    }
                    if (!hasPageError && !offlineHubOpen && !isLoading && offlineReader == null) {
                        FloatingActionButton(
                            onClick = { offlineFiles = loadOfflineFiles(); loadOfflineChapters(); offlineHubOpen = true },
                            modifier = Modifier.align(Alignment.BottomEnd).padding(end = 16.dp, bottom = 20.dp),
                            containerColor = PurplePrimary,
                            contentColor = Color.White
                        ) { Icon(Icons.Filled.LibraryBooks, contentDescription = "Çevrimdışı kütüphanem") }
                    }
                    offlineReader?.let { chapter -> OfflineChapterReader(chapter, onBack = { offlineReader = null }) }
                    when (val download = chapterDownloadState) {
                        is ChapterDownloadState.Downloading -> AlertDialog(
                            onDismissRequest = {},
                            title = { Text("Bölüm indiriliyor") },
                            text = { Column { Text("${download.series} · ${download.chapter}"); Spacer(Modifier.height(12.dp)); LinearProgressIndicator(progress = download.current.toFloat() / download.total.coerceAtLeast(1), modifier = Modifier.fillMaxWidth()); Text("${download.current} / ${download.total} sayfa", modifier = Modifier.padding(top = 8.dp)) } },
                            confirmButton = {}
                        )
                        is ChapterDownloadState.Error -> AlertDialog(
                            onDismissRequest = { chapterDownloadState = null },
                            title = { Text("İndirme tamamlanamadı") }, text = { Text(download.message) },
                            confirmButton = { TextButton(onClick = { chapterDownloadState = null }) { Text("Tamam") } }
                        )
                        null -> Unit
                    }
                    when (val state = updateState) {
                        is UpdateUiState.Available -> UpdateDialog(
                            title = "MahoraPeak ${state.update.version} hazır",
                            message = "Yeni Android sürümü bulundu. İndirip Android kurulum ekranından güncelleyebilirsin.\n\n${state.update.notes.take(400)}",
                            confirm = "Güncellemeyi indir",
                            dismiss = "Daha sonra",
                            onConfirm = { downloadAndInstall(state.update) },
                            onDismiss = { updateState = UpdateUiState.Hidden }
                        )
                        is UpdateUiState.Downloading -> UpdateDialog(
                            title = "Güncelleme indiriliyor",
                            message = "MahoraPeak ${state.update.version} · ${state.progress}%\nİndirme bitince Android kurulum ekranı açılacak.",
                            confirm = null,
                            dismiss = null,
                            onConfirm = {}, onDismiss = {}
                        )
                        is UpdateUiState.Error -> UpdateDialog(
                            title = "Güncelleme tamamlanamadı",
                            message = state.message,
                            confirm = "Tekrar dene",
                            dismiss = "Kapat",
                            onConfirm = { updateState = UpdateUiState.Hidden; checkForAndroidUpdate() },
                            onDismiss = { updateState = UpdateUiState.Hidden }
                        )
                        UpdateUiState.Hidden -> Unit
                    }
                }
            }
        }
        checkForAndroidUpdate()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView?.let { browser ->
            val browserState = Bundle()
            browser.saveState(browserState)
            outState.putBundle(WEB_VIEW_STATE, browserState)
        }
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        webView?.apply {
            stopLoading()
            (parent as? ViewGroup)?.removeView(this)
            destroy()
        }
        webView = null
        super.onDestroy()
    }

    private fun installNativeBridge(target: WebView) {
        WebViewCompat.addWebMessageListener(
            target,
            "MahoraPeakAndroid",
            setOf("https://mahorapeak.com.tr", "https://www.mahorapeak.com.tr"),
            object : WebViewCompat.WebMessageListener {
                override fun onPostMessage(
                    view: WebView,
                    message: WebMessageCompat,
                    sourceOrigin: Uri,
                    isMainFrame: Boolean,
                    replyProxy: JavaScriptReplyProxy
                ) {
                    if (!isMainFrame || sourceOrigin.host !in setOf("mahorapeak.com.tr", "www.mahorapeak.com.tr")) return
                    val payload = runCatching { JSONObject(message.data ?: "") }.getOrNull() ?: return
                    when (payload.optString("action")) {
                        "downloadChapter" -> downloadOfflineChapter(payload)
                        "requestNotifications" -> requestNotificationPermission()
                        "setReaderMode" -> {
                            isReaderPage = payload.optBoolean("enabled", false)
                            window.decorView.keepScreenOn = isReaderPage
                        }
                        "toggleVolumeNavigation" -> {
                            val enabled = payload.optBoolean("enabled", true)
                            getSharedPreferences("reader_preferences", MODE_PRIVATE).edit().putBoolean("volume_navigation", enabled).apply()
                            replyProxy.postMessage(JSONObject().put("action", "volumeNavigationState").put("enabled", enabled).toString())
                        }
                        "showNotification" -> showPhoneNotification(
                            payload.optString("title").take(80).ifBlank { "MahoraPeak" },
                            payload.optString("body").take(180).ifBlank { "Yeni bir bildirimin var." }
                        )
                    }
                }
            }
        )
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        ) return
        notificationPermissionRequest.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "MahoraPeak bildirimleri",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = "Takip ettiğin seriler ve hesabın için yeni bildirimler" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun showPhoneNotification(title: String, body: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        val notification = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_monochrome)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(this).notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notification)
    }

    companion object {
        private const val HOME_URL = "https://mahorapeak.com.tr/"
        private const val ANDROID_RELEASES_URL = "https://api.github.com/repos/BayDuckYT/anipeak/releases?per_page=100"
        private const val ANDROID_APK_ASSET = "mahorapeak-android.apk"
        private const val WEB_VIEW_STATE = "mahorapeak.webview.state"
        private const val NOTIFICATION_CHANNEL_ID = "mahorapeak_updates"

        private fun isReaderUrl(url: String?): Boolean = url?.let {
            Regex("^https://(?:www\\.)?mahorapeak\\.com\\.tr/manga/[^/]+/bolum-[^/?#]+", RegexOption.IGNORE_CASE).containsMatchIn(it)
        } == true

        private const val MOBILE_APP_SCRIPT = """
            (function() {
              if (window.__mahoraMobileEnhancementInstalled) return;
              window.__mahoraMobileEnhancementInstalled = true;
              document.documentElement.classList.add('mahorapeak-native-app');
              var css = `
                html.mahorapeak-native-app { scroll-padding-top: env(safe-area-inset-top); }
                html.mahorapeak-native-app body { overscroll-behavior-y: contain; }
                html.mahorapeak-native-app .mp-app-notification-shell {
                  position: fixed !important; top: auto !important; left: 12px !important; right: 12px !important;
                  bottom: calc(env(safe-area-inset-bottom, 0px) + 10px) !important; width: auto !important;
                  margin: 0 !important; z-index: 9999 !important; transform: none !important;
                }
                html.mahorapeak-native-app .mp-app-notification-panel {
                  width: 100% !important; max-height: min(78dvh, 680px) !important; border-radius: 24px !important;
                }
                html.mahorapeak-native-app .mp-app-calendar-hero {
                  height: 38svh !important; min-height: 300px !important; max-height: 420px !important;
                  margin-bottom: 16px !important;
                }
                html.mahorapeak-native-app #takvim-ana-bolum { padding-left: 14px !important; padding-right: 14px !important; gap: 18px !important; }
                html.mahorapeak-native-app .mp-app-week-strip {
                  display: flex !important; overflow-x: auto !important; gap: 8px !important; padding: 2px 1px 10px !important;
                  scroll-snap-type: x mandatory; scrollbar-width: none;
                }
                html.mahorapeak-native-app .mp-app-week-strip::-webkit-scrollbar { display: none; }
                html.mahorapeak-native-app .mp-app-week-strip > button {
                  flex: 0 0 88px !important; min-height: 92px !important; padding: 11px 8px !important; scroll-snap-align: start;
                }
                html.mahorapeak-native-app .mp-app-schedule-controls { gap: 10px !important; padding: 12px !important; border-radius: 20px !important; }
                html.mahorapeak-native-app .mp-app-schedule-controls > * { width: 100% !important; max-width: none !important; }
                html.mahorapeak-native-app .mp-app-schedule-controls input { min-height: 44px !important; font-size: 14px !important; }
                html.mahorapeak-native-app [href='/indir'], html.mahorapeak-native-app [href^='/indir?'],
                html.mahorapeak-native-app [href='/apps'], html.mahorapeak-native-app [href^='/apps?'],
                html.mahorapeak-native-app [href='/uygulama'], html.mahorapeak-native-app [href^='/uygulama?'] { display: none !important; }
              `;
              var style = document.getElementById('mahorapeak-native-mobile-style');
              if (!style) { style = document.createElement('style'); style.id = 'mahorapeak-native-mobile-style'; document.head.appendChild(style); }
              style.textContent = css;
              var readerPath = '';
              var nativeReaderMode = null;
              var readerDock = null;
              var readerHideTimer = 0;
              var readerRestoreAttempt = 0;
              var readerSaveTimer = 0;
              function scheduleReaderDockHide() {
                clearTimeout(readerHideTimer);
                readerHideTimer = setTimeout(function() { if (readerDock) readerDock.classList.add('mp-reader-hidden'); }, 3200);
              }
              function readerStep(direction) {
                window.scrollBy({ top: Math.round(window.innerHeight * 0.82 * direction), behavior: 'smooth' });
                if (readerDock) { readerDock.classList.remove('mp-reader-hidden'); updateReaderProgress(); scheduleReaderDockHide(); }
              }
              window.__mahoraReaderControls = { step: readerStep };
              function updateReaderProgress() {
                if (!readerDock) return;
                var label = readerDock.querySelector('[data-reader-progress]');
                var pages = Array.from(document.querySelectorAll('img[alt^="Page "]'));
                if (!pages.length) { label.textContent = Math.round((window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)) * 100) + '%'; return; }
                var marker = window.scrollY + window.innerHeight * 0.32;
                var current = 0;
                pages.forEach(function(page, index) { if (page.getBoundingClientRect().top + window.scrollY <= marker) current = index; });
                label.textContent = 'Sayfa ' + (current + 1) + ' / ' + pages.length;
              }
              function restoreReaderPosition(path) {
                var ratio = Number(localStorage.getItem('mp-reader-position:' + path) || 0);
                if (!ratio) return;
                var pagesReady = document.querySelectorAll('img[alt^="Page "]').length > 0;
                var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
                if (pagesReady && maxScroll > 0) {
                  window.scrollTo({ top: Math.round(maxScroll * Math.min(1, ratio)), behavior: 'instant' });
                  updateReaderProgress();
                  return;
                }
                if (readerRestoreAttempt++ < 12) setTimeout(function() { restoreReaderPosition(path); }, 350);
              }
              function installReaderControls() {
                var isReader = /^\/manga\/[^/]+\/bolum-[^/]+/i.test(location.pathname);
                if (nativeReaderMode !== isReader) {
                  nativeReaderMode = isReader;
                  if (window.MahoraPeakAndroid) window.MahoraPeakAndroid.postMessage(JSON.stringify({ action: 'setReaderMode', enabled: isReader }));
                }
                if (!isReader) {
                  if (readerDock) readerDock.remove();
                  readerDock = null;
                  readerPath = '';
                  return;
                }
                if (!readerDock) {
                  var readerStyle = document.getElementById('mahorapeak-reader-controls-style');
                  if (!readerStyle) {
                    readerStyle = document.createElement('style'); readerStyle.id = 'mahorapeak-reader-controls-style';
                    readerStyle.textContent = `
                       #mahorapeak-reader-dock { position:fixed; z-index:10020; left:50%; bottom:calc(env(safe-area-inset-bottom, 0px) + 12px); transform:translateX(-50%); display:flex; align-items:center; gap:5px; max-width:calc(100vw - 12px); overflow-x:auto; scrollbar-width:none; padding:6px; border:1px solid rgba(196,154,255,.28); border-radius:18px; background:rgba(14,10,23,.92); color:#fff; box-shadow:0 12px 36px rgba(0,0,0,.44),0 0 24px rgba(128,65,220,.18); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); transition:opacity .24s ease, transform .24s ease; }
                       #mahorapeak-reader-dock::-webkit-scrollbar { display:none; }
                      #mahorapeak-reader-dock.mp-reader-hidden { opacity:0; pointer-events:none; transform:translate(-50%,12px); }
                      #mahorapeak-reader-dock button { min-width:42px; height:42px; padding:0 11px; border:1px solid rgba(255,255,255,.1); border-radius:13px; background:rgba(255,255,255,.07); color:#f6f1ff; font:700 13px system-ui,sans-serif; touch-action:manipulation; }
                      #mahorapeak-reader-dock button:active { background:rgba(145,78,230,.5); transform:scale(.96); }
                      #mahorapeak-reader-dock [data-reader-progress] { min-width:72px; color:#d8c5ff; text-align:center; font:700 11px system-ui,sans-serif; white-space:nowrap; }
                      #mahorapeak-reader-dock [data-reader-volume] { min-width:54px; color:#d8c5ff; font-size:10px; }
                      .mp-reader-tap-zone { position:fixed; z-index:10010; top:12%; bottom:18%; width:min(17vw,64px); border:0; background:transparent; opacity:.16; color:#fff; font-size:24px; touch-action:manipulation; }
                      .mp-reader-tap-zone:active { opacity:.8; }
                      #mp-reader-prev-zone { left:0; } #mp-reader-next-zone { right:0; }
                      @media (prefers-reduced-motion: reduce) { #mahorapeak-reader-dock { transition:none; } }
                    `;
                    document.head.appendChild(readerStyle);
                  }
                  readerDock = document.createElement('div'); readerDock.id = 'mahorapeak-reader-dock';
                   readerDock.innerHTML = '<button type="button" data-reader-step="-1" aria-label="Önceki ekran">‹</button><span data-reader-progress>Sayfa</span><button type="button" data-reader-step="1" aria-label="Sonraki ekran">›</button><button type="button" data-reader-download aria-label="Bölümü indir">⬇ İndir</button><button type="button" data-reader-chapters aria-label="Bölüm listesi">Bölüm</button><button type="button" data-reader-volume aria-label="Ses tuşu ayarı">Ses: Açık</button>';
                  document.body.appendChild(readerDock);
                   readerDock.querySelector('[data-reader-download]').addEventListener('click', function(event) {
                     event.stopPropagation();
                     var match = location.pathname.match(/^\/manga\/([^/]+)\/(bolum-[^/]+)/i);
                     var pages = Array.from(document.querySelectorAll('img[alt^="Page "]')).map(function(img) { return img.currentSrc || img.src; }).filter(Boolean);
                     if (!match || !pages.length || !window.MahoraPeakAndroid) { alert('Bölüm sayfaları henüz yüklenmedi. Biraz bekleyip tekrar dene.'); return; }
                     var chapterNumber = Number((match[2].match(/[\d.]+/) || ['0'])[0]);
                     var seriesTitle = document.querySelector('main h1')?.textContent?.trim() || document.title.split('|')[0].trim();
                     window.MahoraPeakAndroid.postMessage(JSON.stringify({ action: 'downloadChapter', seriesSlug: match[1], chapterSlug: match[2], seriesTitle: seriesTitle, chapterTitle: 'Bölüm ' + chapterNumber, chapterNumber: chapterNumber, pages: pages }));
                     scheduleReaderDockHide();
                   });
                  ['-1','1'].forEach(function(direction) { readerDock.querySelector('[data-reader-step="' + direction + '"]').addEventListener('click', function(event) { event.stopPropagation(); readerStep(Number(direction)); }); });
                  readerDock.querySelector('[data-reader-chapters]').addEventListener('click', function(event) {
                    event.stopPropagation();
                    var chapterMenu = document.querySelector('button[aria-label="Ayarlar ve bölüm seçimi"]');
                    if (chapterMenu) chapterMenu.click();
                    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                    scheduleReaderDockHide();
                  });
                  var volumeButton = readerDock.querySelector('[data-reader-volume]');
                  var volumeEnabled = localStorage.getItem('mp-reader-volume-navigation') !== 'false';
                  function paintVolumeButton() { volumeButton.textContent = volumeEnabled ? 'Ses: Açık' : 'Ses: Kapalı'; volumeButton.setAttribute('aria-pressed', String(volumeEnabled)); }
                  paintVolumeButton();
                  volumeButton.addEventListener('click', function(event) {
                    event.stopPropagation(); volumeEnabled = !volumeEnabled;
                    localStorage.setItem('mp-reader-volume-navigation', String(volumeEnabled)); paintVolumeButton();
                    if (window.MahoraPeakAndroid) window.MahoraPeakAndroid.postMessage(JSON.stringify({ action: 'toggleVolumeNavigation', enabled: volumeEnabled }));
                    scheduleReaderDockHide();
                  });
                  document.addEventListener('click', function(event) {
                    if (!readerDock || !/^\/manga\/[^/]+\/bolum-[^/]+/i.test(location.pathname)) return;
                    if (event.target.closest('#mahorapeak-reader-dock,.mp-reader-tap-zone,a,button,input,textarea,select')) return;
                    readerDock.classList.remove('mp-reader-hidden'); scheduleReaderDockHide();
                  }, true);
                  var previousZone = document.createElement('button'); previousZone.type = 'button'; previousZone.id = 'mp-reader-prev-zone'; previousZone.className = 'mp-reader-tap-zone'; previousZone.setAttribute('aria-label','Önceki ekran'); previousZone.textContent = '‹';
                  var nextZone = document.createElement('button'); nextZone.type = 'button'; nextZone.id = 'mp-reader-next-zone'; nextZone.className = 'mp-reader-tap-zone'; nextZone.setAttribute('aria-label','Sonraki ekran'); nextZone.textContent = '›';
                  [previousZone,nextZone].forEach(function(zone) { zone.addEventListener('click', function(event) { event.stopPropagation(); readerStep(zone === nextZone ? 1 : -1); }); document.body.appendChild(zone); });
                  window.addEventListener('message', function(event) {
                    var data = event.data;
                    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (_) { return; } }
                    if (data && data.action === 'volumeNavigationState') {
                      volumeEnabled = !!data.enabled; localStorage.setItem('mp-reader-volume-navigation', String(volumeEnabled)); paintVolumeButton();
                    }
                  });
                }
                if (readerPath !== location.pathname) {
                  readerPath = location.pathname; readerRestoreAttempt = 0;
                  setTimeout(function() { restoreReaderPosition(readerPath); }, 450);
                }
                updateReaderProgress();
                scheduleReaderDockHide();
              }
              window.addEventListener('scroll', function() {
                if (!readerPath || readerSaveTimer) return;
                readerSaveTimer = setTimeout(function() {
                  readerSaveTimer = 0;
                  var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
                  localStorage.setItem('mp-reader-position:' + readerPath, String(Math.min(1, window.scrollY / maxScroll)));
                  updateReaderProgress();
                }, 650);
              }, { passive: true });
              window.addEventListener('resize', updateReaderProgress, { passive: true });
              function guardAndStyle() {
                if (['/indir', '/apps', '/uygulama'].includes(location.pathname)) { location.replace('/'); return; }
                installReaderControls();
                var notificationButton = document.querySelector('button[aria-label="Bildirimler"]');
                var notificationScope = notificationButton && notificationButton.parentElement;
                var notificationPanel = notificationScope ? Array.from(notificationScope.querySelectorAll('div')).find(function(node) {
                  return node.classList.contains('w-[min(26rem,calc(100vw-1.5rem))]');
                }) : null;
                if (notificationPanel) {
                  notificationPanel.classList.add('mp-app-notification-panel');
                  if (notificationPanel.parentElement) notificationPanel.parentElement.classList.add('mp-app-notification-shell');
                }
                var schedule = document.querySelector('#takvim-ana-bolum');
                if (!schedule) return;
                var main = schedule.closest('main');
                if (main && main.firstElementChild) main.firstElementChild.classList.add('mp-app-calendar-hero');
                if (schedule.firstElementChild) schedule.firstElementChild.classList.add('mp-app-schedule-controls');
                Array.from(schedule.querySelectorAll('.grid')).forEach(function(grid) {
                  if (grid.children.length === 7 && grid.querySelector('button')) grid.classList.add('mp-app-week-strip');
                });
              }
              guardAndStyle();
              var pushState = history.pushState;
              history.pushState = function() { var result = pushState.apply(this, arguments); setTimeout(guardAndStyle, 0); return result; };
              var replaceState = history.replaceState;
              history.replaceState = function() { var result = replaceState.apply(this, arguments); setTimeout(guardAndStyle, 0); return result; };
              window.addEventListener('popstate', guardAndStyle);
              document.addEventListener('click', function(event) {
                var target = event.target.closest('button[aria-label="Bildirimler"]');
                if (target && window.MahoraPeakAndroid) window.MahoraPeakAndroid.postMessage(JSON.stringify({ action: 'requestNotifications' }));
              }, true);
              window.addEventListener('notification-received', function(event) {
                if (!window.MahoraPeakAndroid || !event.detail) return;
                var item = event.detail;
                window.MahoraPeakAndroid.postMessage(JSON.stringify({
                  action: 'showNotification', title: item.title || item.seriesName || 'MahoraPeak',
                  body: item.message || item.content || item.description || 'Yeni bir bildirimin var.'
                }));
              });
              var styleQueued = false;
              new MutationObserver(function() {
                if (styleQueued) return;
                styleQueued = true;
                requestAnimationFrame(function() { styleQueued = false; guardAndStyle(); });
              }).observe(document.documentElement, { childList: true, subtree: true });
            })();
        """
    }
}

@Composable
private fun LaunchScreen(progress: Int) {
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(Color(0xFF100C19), Color(0xFF08070D), Color(0xFF0D0B14)))
        ),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Box(
                Modifier.size(82.dp).clip(RoundedCornerShape(27.dp))
                    .background(Brush135),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.MenuBook, contentDescription = null, tint = Color.White, modifier = Modifier.size(39.dp))
                Icon(Icons.Filled.AutoAwesome, contentDescription = null, tint = Color(0xFFFFD68A), modifier = Modifier.size(18.dp).align(Alignment.TopEnd).padding(2.dp))
            }
            Spacer(Modifier.height(22.dp))
            Text("MahoraPeak", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = (-0.8).sp)
            Spacer(Modifier.height(5.dp))
            Text("ANİME  •  MANGA  •  KEŞFET", color = PurpleAccent, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.7.sp)
            Spacer(Modifier.height(30.dp))
            LinearProgressIndicator(
                progress = (progress.coerceIn(0, 100) / 100f).coerceAtLeast(0.08f),
                modifier = Modifier.width(154.dp).height(3.dp).clip(CircleShape),
                color = PurplePrimary,
                trackColor = Color(0xFF30243E)
            )
            Spacer(Modifier.height(12.dp))
            Text(if (progress >= 100) "Hazır" else "MahoraPeak hazırlanıyor…", color = Color(0xFFAAA2B8), fontSize = 12.sp)
        }
    }
}

@Composable
private fun NetworkErrorScreen(
    files: List<OfflineFile>,
    chapters: List<OfflineChapter>,
    onRetry: () -> Unit,
    onOpen: (OfflineFile) -> Unit,
    onDelete: (OfflineFile) -> Unit,
    onDeleteChapter: (OfflineChapter) -> Unit,
    onOpenChapter: (OfflineChapter) -> Unit,
    onClose: (() -> Unit)? = null
) {
    var selectedTab by remember { mutableStateOf("home") }
    var expandedSeries by remember { mutableStateOf<String?>(null) }
    val series = chapters.groupBy { it.seriesTitle }.toSortedMap(String.CASE_INSENSITIVE_ORDER)
    val legacySeries = files.groupBy { offlineSeriesName(it.title) }.toSortedMap(String.CASE_INSENSITIVE_ORDER)
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF100C19), Color(0xFF08070D))))) {
        Column(Modifier.fillMaxSize().padding(horizontal = 18.dp, vertical = 12.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(42.dp).clip(RoundedCornerShape(14.dp)).background(Brush135), contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.MenuBook, contentDescription = null, tint = Color.White, modifier = Modifier.size(22.dp))
                }
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text("MahoraPeak", color = Color.White, fontSize = 19.sp, fontWeight = FontWeight.ExtraBold)
                    Text(if (onClose == null) "ÇEVRİMDIŞI MOD" else "ÇEVRİMDIŞI ALAN", color = PurpleAccent, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
                onClose?.let { TextButton(onClick = it) { Text("Kapat", color = Color.White) } }
            }
            Spacer(Modifier.height(16.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("home" to "Ana sayfa", "library" to "Kütüphanem").forEach { (key, label) ->
                    val active = selectedTab == key
                    Surface(
                        color = if (active) Color(0xFF42266A) else Color(0xFF171321),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f).clickable { selectedTab = key }
                    ) { Text(label, Modifier.padding(vertical = 13.dp), color = if (active) Color.White else Color(0xFFBEB5CC), fontSize = 13.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center) }
                }
            }
            Spacer(Modifier.height(12.dp))
            if (selectedTab == "home") {
              Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                Surface(color = Color(0xFF171321), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(18.dp), horizontalAlignment = Alignment.Start) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.CloudOff, contentDescription = null, tint = PurpleAccent, modifier = Modifier.size(21.dp))
                            Spacer(Modifier.width(9.dp))
                            Text("ÇEVRİMDIŞI MOD", color = PurpleAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.1.sp)
                        }
                        Spacer(Modifier.height(12.dp))
                        Text("Okumaya kaldığın yerden devam et.", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(6.dp))
                        Text("${chapters.size + files.size} indirme hazır · İnternetsiz açılır", color = Color(0xFFAAA2B8), fontSize = 13.sp)
                        Spacer(Modifier.height(15.dp))
                        Button(onClick = { selectedTab = "library" }, shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.buttonColors(containerColor = PurplePrimary)) {
                            Icon(Icons.Filled.MenuBook, contentDescription = null, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text("Kütüphaneme git", fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                OutlinedButton(onClick = onRetry, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth().height(48.dp)) {
                    Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text("Bağlantıyı yeniden dene", fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(12.dp))
                if (chapters.isNotEmpty()) {
                    Text("SON İNDİRMELER", color = PurpleAccent, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.1.sp)
                    chapters.takeLast(4).reversed().forEach { chapter ->
                        OfflineChapterRow(chapter, onOpenChapter, onDeleteChapter)
                    }
                }
              }
            }
            if (selectedTab == "library") {
              Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                Surface(color = Color(0xFF171321), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(17.dp)) {
                    Text("ÇEVRİMDIŞI KÜTÜPHANE", color = PurpleAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(if (files.isEmpty() && chapters.isEmpty()) "Henüz indirilen bölüm yok" else "${series.size + legacySeries.size} seri · ${files.size + chapters.size} bölüm", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        if (files.isEmpty()) "Bir dosyayı çevrimiçiyken indir; bağlantın olmadığında buradan açabilirsin."
                        else "İndirilen dosyaların cihazında saklanır ve internet olmadan açılır.",
                        color = Color(0xFFAAA2B8), fontSize = 12.sp, lineHeight = 18.sp
                    )
                    if (chapters.isEmpty() && files.isEmpty()) Text("Okuyucudaki ⬇ İndir düğmesiyle bölümleri cihazına kaydet.", color = Color(0xFFAAA2B8), fontSize = 12.sp, lineHeight = 18.sp, modifier = Modifier.padding(top = 10.dp))
                    series.forEach { (seriesName, seriesChapters) ->
                        Spacer(Modifier.height(12.dp))
                        Surface(color = Color(0xFF211A2D), shape = RoundedCornerShape(15.dp), modifier = Modifier.fillMaxWidth().clickable { expandedSeries = if (expandedSeries == seriesName) null else seriesName }) {
                            Column(Modifier.padding(12.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.MenuBook, contentDescription = null, tint = PurpleAccent, modifier = Modifier.size(19.dp))
                                    Spacer(Modifier.width(9.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(seriesName, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                        Text("${seriesChapters.size} indirilen bölüm · Bölüm numarasına göre", color = Color(0xFFAAA2B8), fontSize = 11.sp)
                                    }
                                }
                                if (expandedSeries == seriesName) seriesChapters.sortedBy { it.chapterNumber }.forEach { chapter ->
                                    OfflineChapterRow(chapter, onOpenChapter, onDeleteChapter)
                                }
                            }
                        }
                    }
                    legacySeries.forEach { (seriesName, legacyFiles) ->
                        Text("$seriesName · ${legacyFiles.size} dosya", color = Color(0xFFAAA2B8), fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp))
                        legacyFiles.forEach { file -> Row(Modifier.fillMaxWidth().padding(top = 6.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF211A2D)).clickable { onOpen(file) }.padding(12.dp), verticalAlignment = Alignment.CenterVertically) { Text(file.title, color = Color.White, modifier = Modifier.weight(1f)); Text("Sil", color = Color(0xFFFF8C9B), modifier = Modifier.clickable { onDelete(file) }) } }
                    }
                }
                }
              }
            }
        }
    }
}

@Composable
private fun OfflineChapterRow(chapter: OfflineChapter, onOpen: (OfflineChapter) -> Unit, onDelete: (OfflineChapter) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(top = 8.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF171321)).clickable { onOpen(chapter) }.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Filled.Download, contentDescription = null, tint = PurpleAccent, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(9.dp))
        Column(Modifier.weight(1f)) {
            Text(chapter.chapterTitle, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
            Text("${chapter.pages.size} sayfa · ${String.format("%.1f MB", chapter.sizeBytes / 1024f / 1024f)}", color = Color(0xFFAAA2B8), fontSize = 10.sp)
        }
        Text("Oku", color = PurpleAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.width(8.dp))
        Text("Sil", color = Color(0xFFFF8C9B), fontSize = 11.sp, modifier = Modifier.clickable { onDelete(chapter) }.padding(4.dp))
    }
}

@Composable
private fun OfflineChapterReader(chapter: OfflineChapter, onBack: () -> Unit) {
    val context = LocalContext.current
    Surface(Modifier.fillMaxSize(), color = Color(0xFF08070D)) {
        Column {
            Row(Modifier.fillMaxWidth().background(Color(0xFF100C19)).padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("‹", color = PurpleAccent, fontSize = 28.sp, modifier = Modifier.clickable { onBack() }.padding(horizontal = 8.dp))
                Column(Modifier.weight(1f)) { Text(chapter.seriesTitle, color = Color.White, fontWeight = FontWeight.Bold, maxLines = 1); Text(chapter.chapterTitle, color = Color(0xFFAAA2B8), fontSize = 12.sp) }
                Text("${chapter.pages.size} sayfa", color = Color(0xFFAAA2B8), fontSize = 11.sp)
            }
            LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                items(chapter.pages) { page -> AsyncImage(model = File(File(context.filesDir, chapter.directory), page), contentDescription = "Bölüm sayfası", modifier = Modifier.fillMaxWidth()) }
            }
        }
    }
}

private val Brush135: Brush
    get() = Brush.linearGradient(listOf(Color(0xFF9B43E8), Color(0xFF6126B7), Color(0xFF31165D)))

private fun chapterNumber(title: String): Int = Regex("(?i)(?:bölüm|bolum|chapter|ch\\.?|ep\\.?)\\s*(\\d+)")
    .find(title)?.groupValues?.getOrNull(1)?.toIntOrNull() ?: Int.MAX_VALUE

private fun offlineSeriesName(title: String): String {
    val clean = title.substringBeforeLast('.', title)
        .replace(Regex("(?i)[ _.-]*(?:bölüm|bolum|chapter|ch\\.?|ep\\.?)\\s*\\d+.*$"), "")
        .replace(Regex("[_-]+"), " ").trim()
    return clean.ifBlank { "İndirilen bölümler" }
}

private fun safeFilePart(value: String): String = value.lowercase()
    .replace(Regex("[^a-z0-9._-]"), "-").trim('-', '.', '_').take(100)

private fun compareVersions(first: String, second: String): Int {
    val left = first.split('.', '-', '+').map { it.toIntOrNull() ?: 0 }
    val right = second.split('.', '-', '+').map { it.toIntOrNull() ?: 0 }
    for (i in 0 until maxOf(left.size, right.size)) {
        val cmp = (left.getOrElse(i) { 0 }).compareTo(right.getOrElse(i) { 0 })
        if (cmp != 0) return cmp
    }
    return 0
}

@Composable
private fun UpdateDialog(
    title: String,
    message: String,
    confirm: String?,
    dismiss: String?,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (dismiss != null) onDismiss() },
        containerColor = Color(0xFF171321),
        titleContentColor = Color.White,
        textContentColor = Color(0xFFBEB5CC),
        title = { Text(title, fontWeight = FontWeight.Bold) },
        text = { Column {
            Text(message, lineHeight = 20.sp)
            if (confirm == null) {
                Spacer(Modifier.height(18.dp))
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth().clip(CircleShape), color = PurplePrimary, trackColor = Color(0xFF332642))
            }
        } },
        confirmButton = { if (confirm != null) TextButton(onClick = onConfirm) { Text(confirm, color = PurpleAccent, fontWeight = FontWeight.Bold) } },
        dismissButton = { if (dismiss != null) TextButton(onClick = onDismiss) { Text(dismiss, color = Color(0xFFBEB5CC)) } }
    )
}
