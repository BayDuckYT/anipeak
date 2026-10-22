package com.mahorapeak.manga

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.os.Environment
import android.webkit.CookieManager
import android.webkit.SslErrorHandler
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.mahorapeak.manga.ui.theme.BackgroundDark
import com.mahorapeak.manga.ui.theme.MahoraPeakTheme
import com.mahorapeak.manga.ui.theme.PurpleAccent
import com.mahorapeak.manga.ui.theme.PurplePrimary
import com.mahorapeak.manga.ui.theme.SurfaceDark
import com.mahorapeak.manga.ui.theme.TextPrimary
import com.mahorapeak.manga.ui.theme.TextSecondary
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private var webView: WebView? = null
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var updateProgress: ((Int) -> Unit)? = null
    private var updateError: ((Boolean) -> Unit)? = null

    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val callback = fileChooserCallback
        fileChooserCallback = null
        callback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = android.graphics.Color.rgb(16, 12, 28)
        window.navigationBarColor = android.graphics.Color.rgb(16, 12, 28)
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = false
        WebView.setWebContentsDebuggingEnabled(false)

        setContent {
            MahoraPeakTheme {
                var progress by remember { mutableIntStateOf(0) }
                var pageFailed by remember { mutableStateOf(false) }
                updateProgress = { progress = it }
                updateError = { pageFailed = it }

                BackHandler {
                    val current = webView
                    if (current?.canGoBack() == true) current.goBack() else finish()
                }

                Box(Modifier.fillMaxSize().background(BackgroundDark)) {
                    AndroidView(
                        modifier = Modifier.fillMaxSize(),
                        factory = { context -> createWebView(context).also { webView = it } },
                        onRelease = { view ->
                            if (webView === view) webView = null
                            view.stopLoading()
                            view.destroy()
                        }
                    )

                    if (pageFailed) {
                        ConnectionError(onRetry = {
                            pageFailed = false
                            progress = 0
                            webView?.loadUrl(HOME_URL)
                        })
                    } else if (progress < 100) {
                        if (progress < 24) AppLoading() else LinearProgressIndicator(
                            progress = progress / 100f,
                            modifier = Modifier.fillMaxWidth().height(3.dp).align(Alignment.TopCenter),
                            color = PurplePrimary,
                            trackColor = Color.Transparent
                        )
                    }
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(context: android.content.Context): WebView {
        CookieManager.getInstance().setAcceptCookie(true)
        return WebView(context).apply {
            setBackgroundColor(android.graphics.Color.rgb(5, 5, 8))
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                loadsImagesAutomatically = true
                useWideViewPort = true
                loadWithOverviewMode = false
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                allowFileAccess = false
                allowContentAccess = true
                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                javaScriptCanOpenWindowsAutomatically = true
                setSupportMultipleWindows(false)
            }
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = WebView.OVER_SCROLL_NEVER

            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    updateError?.invoke(false)
                    updateProgress?.invoke(0)
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    updateProgress?.invoke(100)
                }

                override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                    if (request?.isForMainFrame == true) updateError?.invoke(true)
                }

                override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: android.webkit.WebResourceResponse?) {
                    if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 200) >= 500) {
                        updateError?.invoke(true)
                    }
                }

                override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                    handler?.cancel()
                    updateError?.invoke(true)
                }

                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return false
                    if (isTrustedWebAddress(uri)) return false
                    openOutside(uri)
                    return true
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    updateProgress?.invoke(newProgress)
                }

                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    this@MainActivity.fileChooserCallback?.onReceiveValue(null)
                    this@MainActivity.fileChooserCallback = filePathCallback
                    return try {
                        val intent = fileChooserParams?.createIntent()
                            ?: Intent(Intent.ACTION_GET_CONTENT).apply { type = "*/*"; addCategory(Intent.CATEGORY_OPENABLE) }
                        filePicker.launch(intent)
                        true
                    } catch (_: ActivityNotFoundException) {
                        this@MainActivity.fileChooserCallback?.onReceiveValue(null)
                        this@MainActivity.fileChooserCallback = null
                        false
                    }
                }
            }

            setDownloadListener { url, _, contentDisposition, mimeType, _ ->
                try {
                    val request = DownloadManager.Request(Uri.parse(url)).apply {
                        setMimeType(mimeType)
                        setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType))
                        setDescription("MahoraPeak indirme")
                        setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                        setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimeType))
                    }
                    val manager = context.getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                    manager.enqueue(request)
                    Toast.makeText(context, "İndirme başlatıldı", Toast.LENGTH_SHORT).show()
                } catch (_: Exception) {
                    Toast.makeText(context, "Dosya indirilemedi", Toast.LENGTH_SHORT).show()
                }
            }

            loadUrl(HOME_URL)
        }
    }

    private fun isTrustedWebAddress(uri: Uri): Boolean {
        if (uri.scheme !in setOf("https", "http")) return false
        val host = uri.host?.lowercase() ?: return false
        return host == "mahorapeak.com.tr" || host.endsWith(".mahorapeak.com.tr") ||
            host == "supabase.co" || host.endsWith(".supabase.co")
    }

    private fun openOutside(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, "Bu bağlantıyı açacak uygulama bulunamadı", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        super.onDestroy()
    }

    private companion object {
        const val HOME_URL = "https://mahorapeak.com.tr"
    }
}

@Composable
private fun AppLoading() {
    Column(
        modifier = Modifier.fillMaxSize().background(BackgroundDark),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(Modifier.size(74.dp).clip(RoundedCornerShape(23.dp)).background(SurfaceDark), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = PurplePrimary, strokeWidth = 3.dp, modifier = Modifier.size(32.dp))
        }
        Spacer(Modifier.height(18.dp))
        Text("MAHORAPEAK", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 2.sp)
        Spacer(Modifier.height(5.dp))
        Text("Hikâyen yükleniyor…", color = TextSecondary, fontSize = 13.sp)
    }
}

@Composable
private fun ConnectionError(onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().background(BackgroundDark).padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Filled.CloudOff, contentDescription = null, tint = PurpleAccent, modifier = Modifier.size(46.dp))
        Spacer(Modifier.height(16.dp))
        Text("Bağlantı kurulamadı", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text("İnternet bağlantını kontrol edip tekrar deneyebilirsin.", color = TextSecondary, fontSize = 14.sp)
        Spacer(Modifier.height(20.dp))
        Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = PurplePrimary), shape = RoundedCornerShape(14.dp)) {
            Icon(Icons.Filled.Refresh, contentDescription = null); Spacer(Modifier.width(8.dp)); Text("Yeniden dene")
        }
    }
}
