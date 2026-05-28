package com.mahorapeak.manga.ui.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mahorapeak.manga.ui.components.MangaCard
import com.mahorapeak.manga.ui.components.SectionHeader
import com.mahorapeak.manga.ui.home.HomeUiState
import com.mahorapeak.manga.ui.home.HomeViewModel
import com.mahorapeak.manga.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedCategory by remember { mutableStateOf("Popüler") }
    val categories = listOf("Popüler", "Aksiyon", "Fantastik", "Romantik", "Macera", "Dram")

    Scaffold(
        containerColor = BackgroundDark,
        topBar = { DiscoverTopBar() }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            // Categories
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { category ->
                    FilterChip(
                        selected = selectedCategory == category,
                        onClick = { selectedCategory = category },
                        label = { Text(category) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PurplePrimary,
                            selectedLabelColor = Color.White,
                            containerColor = SurfaceDark,
                            labelColor = TextSecondary
                        ),
                        border = null
                    )
                }
            }

            when (val state = uiState) {
                is HomeUiState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = PurplePrimary)
                    }
                }
                is HomeUiState.Success -> {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(state.series) { item ->
                            MangaCard(
                                title = item.title,
                                imageUrl = item.cover,
                                rating = 9.5,
                                onClick = { /* Navigate to Detail */ }
                            )
                        }
                    }
                }
                is HomeUiState.Error -> {
                    Text("Hata: ${state.message}", color = ErrorRed)
                }
            }
        }
    }
}

@Composable
fun DiscoverTopBar() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(
            "Keşfet",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = "",
            onValueChange = {},
            placeholder = { Text("Manga, yazar veya tür ara...", color = TextSecondary) },
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(SurfaceDark),
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary) },
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = Color.Transparent,
                focusedBorderColor = PurplePrimary,
                cursorColor = PurplePrimary
            ),
            singleLine = true
        )
    }
}
