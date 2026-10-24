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

    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val callback = fileChooserCallback ?: return@registerForActivityResult
        fileChooserCallback = null
        callback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = AndroidColor.rgb(10, 8, 16)
        window.navigationBarColor = AndroidColor.rgb(10, 8, 16)
        createNotificationChannel()

        var reloadPage: (() -> Unit)? = null
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
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
                                    }

                                    override fun onPageFinished(view: WebView?, url: String?) {
                                        isLoading = false
                                        hasPageError = false
                                        swipeRefresh.isRefreshing = false
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
                            onDelete = { file -> removeOfflineFile(file); offlineFiles = loadOfflineFiles() },
                            onRetry = {
                                hasPageError = false
                                isLoading = true
                                reloadPage?.invoke()
                            },
                            onOpen = { file -> file.uri?.let { uri ->
                                runCatching {
                                    val type = contentResolver.getType(uri) ?: "application/octet-stream"
                                    startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, type).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION))
                                }.onFailure {
                                    Toast.makeText(this@MainActivity, "Bu dosya için açacak uygulama bulunamadı", Toast.LENGTH_SHORT).show()
                                }
                            } }
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
                        "requestNotifications" -> requestNotificationPermission()
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
              function guardAndStyle() {
                if (['/indir', '/apps', '/uygulama'].includes(location.pathname)) { location.replace('/'); return; }
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
    onRetry: () -> Unit,
    onOpen: (OfflineFile) -> Unit,
    onDelete: (OfflineFile) -> Unit
) {
    var selectedTab by remember { mutableStateOf("home") }
    val series = files.groupBy { offlineSeriesName(it.title) }.toSortedMap(String.CASE_INSENSITIVE_ORDER)
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF100C19), Color(0xFF08070D))))) {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(10.dp))
            Box(Modifier.size(68.dp).clip(RoundedCornerShape(22.dp)).background(Brush135), contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.MenuBook, contentDescription = null, tint = Color.White, modifier = Modifier.size(32.dp))
            }
            Spacer(Modifier.height(14.dp))
            Text("MahoraPeak", color = Color.White, fontSize = 25.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(22.dp))
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
            Spacer(Modifier.height(16.dp))
            if (selectedTab == "home") {
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
                        Text("${files.size} bölüm hazır · İnternet bağlantısı olmadan açılır", color = Color(0xFFAAA2B8), fontSize = 13.sp)
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
            }
            if (selectedTab == "library") {
            Surface(color = Color(0xFF171321), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(17.dp)) {
                    Text("ÇEVRİMDIŞI KÜTÜPHANE", color = PurpleAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(if (files.isEmpty()) "Henüz indirilen bölüm yok" else "${series.size} seri · ${files.size} bölüm", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        if (files.isEmpty()) "Bir dosyayı çevrimiçiyken indir; bağlantın olmadığında buradan açabilirsin."
                        else "İndirilen dosyaların cihazında saklanır ve internet olmadan açılır.",
                        color = Color(0xFFAAA2B8), fontSize = 12.sp, lineHeight = 18.sp
                    )
                    series.forEach { (seriesName, chapters) ->
                        Spacer(Modifier.height(12.dp))
                        Surface(color = Color(0xFF211A2D), shape = RoundedCornerShape(15.dp), modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(12.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.MenuBook, contentDescription = null, tint = PurpleAccent, modifier = Modifier.size(19.dp))
                                    Spacer(Modifier.width(9.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(seriesName, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                        Text("${chapters.size} indirilen bölüm · Bölüm numarasına göre", color = Color(0xFFAAA2B8), fontSize = 11.sp)
                                    }
                                }
                                chapters.sortedBy { chapterNumber(it.title) }.forEach { file ->
                                    Spacer(Modifier.height(8.dp))
                                    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF171321)).clickable { onOpen(file) }.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Filled.Download, contentDescription = null, tint = PurpleAccent, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(9.dp))
                                        Column(Modifier.weight(1f)) {
                                            Text(file.title, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                                            Text(file.sizeLabel, color = Color(0xFFAAA2B8), fontSize = 10.sp)
                                        }
                                        Icon(Icons.Filled.OpenInNew, contentDescription = "Aç", tint = Color(0xFFAAA2B8), modifier = Modifier.size(17.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text("Sil", color = Color(0xFFFF8C9B), fontSize = 11.sp, modifier = Modifier.clickable { onDelete(file) }.padding(4.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            }
            Spacer(Modifier.height(16.dp))
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
