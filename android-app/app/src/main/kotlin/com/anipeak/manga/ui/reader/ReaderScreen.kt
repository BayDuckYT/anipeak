package com.anipeak.manga.ui.reader

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.anipeak.manga.ui.theme.*

@Composable
fun ReaderScreen(
    seriesId: Int,
    chapterId: Int,
    viewModel: ReaderViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    var showControls by remember { mutableStateOf(true) }

    LaunchedEffect(seriesId, chapterId) {
        viewModel.loadChapter(seriesId, chapterId)
    }

    Scaffold(
        containerColor = Color.Black
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            when (val s = state) {
                is ReaderUiState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = PurplePrimary)
                    }
                }
                is ReaderUiState.Success -> {
                    ReaderContent(s.images, onToggleControls = { showControls = !showControls })
                    
                    if (showControls) {
                        ReaderControls(
                            chapterTitle = "Bölüm 102",
                            onBack = { /* Pop back */ }
                        )
                    }
                }
                is ReaderUiState.Error -> {
                    Text(s.message, color = ErrorRed, modifier = Modifier.padding(16.dp))
                }
            }
        }
    }
}

@Composable
fun ReaderContent(images: List<String>, onToggleControls: () -> Unit) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
    ) {
        items(images) { imageUrl ->
            AsyncImage(
                model = imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .wrapContentHeight(),
                contentScale = ContentScale.FillWidth
            )
        }
    }
}

@Composable
fun BoxScope.ReaderControls(
    chapterTitle: String,
    onBack: () -> Unit
) {
    // Top Bar
    Row(
        modifier = Modifier
            .align(Alignment.TopCenter)
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.7f))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
        }
        Spacer(Modifier.width(16.dp))
        Column {
            Text("Solo Leveling", color = Color.White, fontWeight = FontWeight.Bold)
            Text(chapterTitle, color = TextSecondary, fontSize = 12.sp)
        }
        Spacer(Modifier.weight(1f))
        IconButton(onClick = {}) {
            Icon(Icons.Default.Settings, contentDescription = null, tint = Color.White)
        }
    }

    // Bottom Navigation
    Row(
        modifier = Modifier
            .align(Alignment.BottomCenter)
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.7f))
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = {}) {
            Icon(Icons.Default.ChevronLeft, contentDescription = null, tint = Color.White)
        }
        
        Text(
            "1 / 48",
            color = Color.White,
            fontWeight = FontWeight.Bold,
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .background(GlassPurple)
                .padding(horizontal = 12.dp, vertical = 4.dp)
        )
        
        IconButton(onClick = {}) {
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color.White)
        }
    }
}
