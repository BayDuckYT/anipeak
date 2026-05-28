package com.mahorapeak.manga.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = PurplePrimary,
    secondary = PurpleSecondary,
    tertiary = AccentCyan,
    background = BackgroundDark,
    surface = SurfaceDark,
    onPrimary = TextPrimary,
    onSecondary = TextPrimary,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    error = ErrorRed,
    outline = TextSecondary
)

@Composable
fun MahoraPeakTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
