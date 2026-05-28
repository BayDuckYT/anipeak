package com.mahorapeak.manga.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.mahorapeak.manga.ui.home.HomeScreen
import com.mahorapeak.manga.ui.detail.DetailScreen

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Discover : Screen("discover")
    object Library : Screen("library")
    object Community : Screen("community")
    object Profile : Screen("profile")
    object Search : Screen("search")
    object Premium : Screen("premium")
    object Detail : Screen("detail/{id}") {
        fun createRoute(id: Int) = "detail/$id"
    }
    object Reader : Screen("reader/{seriesId}/{chapterId}") {
        fun createRoute(seriesId: Int, chapterId: Int) = "reader/$seriesId/$chapterId"
    }
}

@Composable
fun MahoraPeakNavGraph(navController: NavHostController) {
    NavHost(navController = navController, startDestination = Screen.Home.route) {
        composable(Screen.Home.route) {
            HomeScreen(onSeriesClick = { id ->
                navController.navigate(Screen.Detail.createRoute(id))
            })
        }
        composable(Screen.Discover.route) {
            com.mahorapeak.manga.ui.discover.DiscoverScreen()
        }
        composable(Screen.Library.route) {
            com.mahorapeak.manga.ui.library.LibraryScreen()
        }
        composable(Screen.Community.route) {
            com.mahorapeak.manga.ui.community.CommunityScreen()
        }
        composable(Screen.Profile.route) {
            com.mahorapeak.manga.ui.profile.ProfileScreen(onNavigateToPremium = {
                navController.navigate(Screen.Premium.route)
            })
        }
        composable(Screen.Search.route) {
            com.mahorapeak.manga.ui.search.SearchScreen()
        }
        composable(Screen.Detail.route) { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id")?.toInt() ?: 0
            DetailScreen(seriesId = id, onReadClick = { sid, ch ->
                navController.navigate(Screen.Reader.createRoute(sid, ch))
            })
        }
        composable(Screen.Reader.route) { backStackEntry ->
            val seriesId = backStackEntry.arguments?.getString("seriesId")?.toInt() ?: 0
            val chapterId = backStackEntry.arguments?.getString("chapterId")?.toInt() ?: 0
            com.mahorapeak.manga.ui.reader.ReaderScreen(seriesId, chapterId)
        }
        composable(Screen.Premium.route) {
            com.mahorapeak.manga.ui.premium.PremiumScreen(onBack = { navController.popBackStack() })
        }
    }
}
