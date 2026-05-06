package com.anipeak.manga.ui.library

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.anipeak.manga.ui.components.ContinuingCard
import com.anipeak.manga.ui.home.HomeUiState
import com.anipeak.manga.ui.home.HomeViewModel
import com.anipeak.manga.ui.theme.*

@Composable
fun LibraryScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Okuduklarım", "Favorilerim", "Listelerim")

    Scaffold(
        containerColor = BackgroundDark,
        topBar = {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Kütüphanem",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(Modifier.height(16.dp))
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.Transparent,
                    contentColor = PurplePrimary,
                    indicator = { tabPositions ->
                        TabRowDefaults.Indicator(
                            modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = PurplePrimary
                        )
                    },
                    divider = {}
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { 
                                Text(
                                    title, 
                                    color = if (selectedTab == index) PurplePrimary else TextSecondary,
                                    fontSize = 14.sp
                                ) 
                            }
                        )
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (val state = uiState) {
                is HomeUiState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = PurplePrimary)
                    }
                }
                is HomeUiState.Success -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(state.series) { item ->
                            ContinuingCard(
                                title = item.title,
                                imageUrl = item.cover,
                                chapter = "Bölüm ${item.id * 5}",
                                progress = (item.id % 10) / 10f,
                                onClick = { /* Detail */ }
                            )
                        }
                    }
                }
                is HomeUiState.Error -> {
                    Text(state.message, color = ErrorRed)
                }
            }
        }
    }
}
