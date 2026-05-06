package com.anipeak.manga

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.anipeak.manga.ui.navigation.AniPeakNavGraph
import com.anipeak.manga.ui.theme.AniPeakTheme
import com.anipeak.manga.ui.theme.BackgroundDark
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AniPeakTheme {
                val navController = rememberNavController()
                
                // Set system bar colors
                val systemUiController = rememberSystemUiController()
                SideEffect {
                    systemUiController.setSystemBarsColor(
                        color = BackgroundDark,
                        darkIcons = false
                    )
                }

                Scaffold(
                    bottomBar = { com.anipeak.manga.ui.components.AniPeakBottomBar(navController) }
                ) { padding ->
                    Box(modifier = Modifier.padding(padding)) {
                        AniPeakNavGraph(navController = navController)
                    }
                }
            }
        }
    }
}
