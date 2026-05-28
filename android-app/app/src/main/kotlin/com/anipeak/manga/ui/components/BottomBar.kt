package com.mahorapeak.manga.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.mahorapeak.manga.ui.navigation.Screen
import com.mahorapeak.manga.ui.theme.*

@Composable
fun MahoraPeakBottomBar(navController: NavController) {
    val items = listOf(
        BottomNavItem("Ana Sayfa", Screen.Home.route, Icons.Default.Home),
        BottomNavItem("Keşfet", Screen.Discover.route, Icons.Default.Explore),
        BottomNavItem("Kütüphane", Screen.Library.route, Icons.Default.LibraryBooks),
        BottomNavItem("Topluluk", Screen.Community.route, Icons.Default.Group),
        BottomNavItem("Profil", Screen.Profile.route, Icons.Default.Person)
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Hide bottom bar on detail and reader screens
    if (currentRoute?.contains("detail") == true || currentRoute?.contains("reader") == true) {
        return
    }

    NavigationBar(
        containerColor = Color.Transparent,
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color.Transparent,
                        BackgroundDark.copy(alpha = 0.8f),
                        BackgroundDark
                    )
                )
            )
            .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
            .background(GlassWhite),
        tonalElevation = 0.dp
    ) {
        items.forEach { item ->
            val selected = currentRoute == item.route
            NavigationBarItem(
                selected = selected,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.title,
                        tint = if (selected) PurplePrimary else TextSecondary
                    )
                },
                label = {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (selected) PurplePrimary else TextSecondary
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}

data class BottomNavItem(
    val title: String,
    val route: String,
    val icon: ImageVector
)
