package com.anipeak.manga.ui.detail

import androidx.compose.foundation.*
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.anipeak.manga.data.model.Chapter
import com.anipeak.manga.data.model.Series
import com.anipeak.manga.ui.theme.*

@Composable
fun DetailScreen(
    seriesId: Int,
    onReadClick: (Int, Int) -> Unit,
    viewModel: DetailViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(seriesId) {
        viewModel.loadDetail(seriesId)
    }

    Scaffold(
        containerColor = BackgroundDark
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (val s = state) {
                is DetailUiState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = PurplePrimary)
                    }
                }
                is DetailUiState.Success -> {
                    DetailContent(s.series, s.chapters, onReadClick)
                }
                is DetailUiState.Error -> {
                    Text(s.message, color = ErrorRed, modifier = Modifier.padding(16.dp))
                }
            }
        }
    }
}

@Composable
fun DetailContent(
    series: Series,
    chapters: List<Chapter>,
    onReadClick: (Int, Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize()
    ) {
        // Hero Header
        item {
            DetailHeader(series)
        }

        // Stats & Buttons
        item {
            DetailActions()
        }

        // Description
        item {
            Text(
                "Manga okumak, başka dünyalarda yaşamaktır. Bu hikaye seni bambaşka bir maceraya sürükleyecek.",
                color = TextSecondary,
                modifier = Modifier.padding(16.dp),
                fontSize = 14.sp
            )
        }

        // Chapter Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Bölüm Listesi",
                    color = TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                IconButton(onClick = {}) {
                    Icon(Icons.Default.Settings, contentDescription = null, tint = TextSecondary)
                }
            }
        }

        // Chapters
        items(chapters) { chapter ->
            ChapterItem(chapter, onClick = { onReadClick(series.id, chapter.id) })
        }
        
        item { Spacer(Modifier.height(40.dp)) }
    }
}

@Composable
fun DetailHeader(series: Series) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(400.dp)
    ) {
        AsyncImage(
            model = series.cover,
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            BackgroundDark.copy(alpha = 0.4f),
                            BackgroundDark
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
        ) {
            Text(
                series.title,
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Black,
                color = TextPrimary
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Popüler • 9.8 Rating",
                color = PurpleAccent,
                fontSize = 14.sp
            )
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = { /* First Chapter */ },
                colors = ButtonDefaults.buttonColors(containerColor = PurplePrimary),
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("İlk Bölüme Git", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun DetailActions() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        ActionButton(Icons.Default.Favorite, "Favori")
        ActionButton(Icons.Default.Download, "İndir")
        ActionButton(Icons.Default.Comment, "Yorum")
        ActionButton(Icons.Default.Share, "Paylaş")
    }
}

@Composable
fun ActionButton(icon: ImageVector, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        IconButton(
            onClick = {},
            modifier = Modifier
                .size(50.dp)
                .clip(CircleShape)
                .background(SurfaceDark)
        ) {
            Icon(icon, contentDescription = null, tint = TextPrimary)
        }
        Spacer(Modifier.height(4.dp))
        Text(label, color = TextSecondary, fontSize = 12.sp)
    }
}

@Composable
fun ChapterItem(chapter: Chapter, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(
                "Bölüm ${chapter.number}",
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
            Text(
                "23 May, 2024",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.CheckCircle,
                contentDescription = null,
                tint = PurplePrimary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(Modifier.width(12.dp))
            IconButton(onClick = {}) {
                Icon(Icons.Default.FileDownload, contentDescription = null, tint = TextSecondary)
            }
        }
    }
}
