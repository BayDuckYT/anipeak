package com.anipeak.manga.ui.home

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.anipeak.manga.data.model.Series
import com.anipeak.manga.ui.components.*
import com.anipeak.manga.ui.theme.*

@Composable
fun HomeScreen(
    onSeriesClick: (Int) -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Scaffold(
        containerColor = BackgroundDark,
        topBar = { HomeTopBar() }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(scrollState)
        ) {
            when (val state = uiState) {
                is HomeUiState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = PurplePrimary)
                    }
                }
                is HomeUiState.Success -> {
                    HomeContent(state.series, onSeriesClick)
                }
                is HomeUiState.Error -> {
                    Text(state.message, color = ErrorRed, modifier = Modifier.padding(16.dp))
                }
            }
        }
    }
}

@Composable
fun HomeTopBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(GlassWhite)
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                "AniPeak",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black,
                color = TextPrimary,
                letterSpacing = (-1).sp
            )
            Text(
                "Manga Dünyasını Keşfet",
                style = MaterialTheme.typography.bodySmall,
                color = PurpleAccent
            )
        }
        
        Row {
            IconButton(
                onClick = { /* Search */ },
                modifier = Modifier
                    .clip(CircleShape)
                    .background(SurfaceDark)
            ) {
                Icon(Icons.Default.Search, contentDescription = "Search", tint = TextPrimary)
            }
            Spacer(Modifier.width(12.dp))
            IconButton(
                onClick = { /* Notifications */ },
                modifier = Modifier
                    .clip(CircleShape)
                    .background(SurfaceDark)
            ) {
                Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = TextPrimary)
            }
        }
    }
}

@Composable
fun HomeContent(series: List<Series>, onSeriesClick: (Int) -> Unit) {
    val heroSeries = series.firstOrNull()
    
    // Hero Section
    heroSeries?.let {
        HeroSection(it, onSeriesClick)
    }

    Spacer(Modifier.height(24.dp))

    // Continuing Section
    SectionHeader(title = "Devam Ediyor")
    LazyRow(
        contentPadding = PaddingValues(horizontal = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Sample data for continuing
        items(series.take(3)) { item ->
            ContinuingCard(
                title = item.title,
                imageUrl = item.cover,
                chapter = "Bölüm 102",
                progress = 0.78f,
                onClick = { onSeriesClick(item.id) }
            )
        }
    }

    Spacer(Modifier.height(24.dp))

    // Popular Section
    SectionHeader(title = "Popüler Seriler")
    LazyRow(
        contentPadding = PaddingValues(horizontal = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(series) { item ->
            MangaCard(
                title = item.title,
                imageUrl = item.cover,
                rating = 9.8,
                onClick = { onSeriesClick(item.id) }
            )
        }
    }

    Spacer(Modifier.height(24.dp))

    // Trending Today
    SectionHeader(title = "Günün Trendleri")
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        series.takeLast(3).forEach { item ->
            TrendingListItem(item, onSeriesClick)
            Spacer(Modifier.height(12.dp))
        }
    }
    
    Spacer(Modifier.height(40.dp))
}

@Composable
fun HeroSection(series: Series, onSeriesClick: (Int) -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(450.dp)
            .clickable { onSeriesClick(series.id) }
    ) {
        AsyncImage(
            model = series.cover,
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        
        // Gradient Overlays
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            BackgroundDark.copy(alpha = 0.5f),
                            BackgroundDark
                        ),
                        startY = 300f
                    )
                )
        )

        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(24.dp)
        ) {
            Text(
                series.title,
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Black,
                color = TextPrimary
            )
            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Action",
                    color = PurpleAccent,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Text("  •  ", color = TextSecondary)
                Text(
                    "Supernatural",
                    color = PurpleAccent,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = { onSeriesClick(series.id) },
                colors = ButtonDefaults.buttonColors(containerColor = PurplePrimary),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.height(48.dp).fillMaxWidth(0.5f)
            ) {
                Text("Devam Et", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun TrendingListItem(series: Series, onSeriesClick: (Int) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(SurfaceDark)
            .clickable { onSeriesClick(series.id) }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = series.cover,
            contentDescription = null,
            modifier = Modifier
                .size(60.dp)
                .clip(RoundedCornerShape(12.dp)),
            contentScale = ContentScale.Crop
        )
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                series.title,
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                "Manhwa • 124 Bölüm",
                color = TextSecondary,
                fontSize = 13.sp
            )
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Star, null, tint = AccentYellow, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(4.dp))
            Text("9.5", color = TextPrimary, fontWeight = FontWeight.Bold)
        }
    }
}
