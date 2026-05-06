package com.anipeak.manga.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
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
import coil.compose.AsyncImage
import com.anipeak.manga.ui.theme.*

@Composable
fun MangaCard(
    title: String,
    imageUrl: String,
    rating: Double,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(140.dp)
            .clickable { onClick() }
            .padding(4.dp)
    ) {
        Box(
            modifier = Modifier
                .height(200.dp)
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
        ) {
            AsyncImage(
                model = imageUrl,
                contentDescription = title,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            
            // Rating Tag
            Row(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(8.dp)
                    .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 6.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Star,
                    contentDescription = null,
                    tint = AccentYellow,
                    modifier = Modifier.size(12.dp)
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    rating.toString(),
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        
        Spacer(Modifier.height(8.dp))
        
        Text(
            title,
            color = TextPrimary,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun SectionHeader(
    title: String,
    onViewAllClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            title,
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
        TextButton(onClick = onViewAllClick) {
            Text("Tümünü Gör", color = PurpleAccent, fontSize = 14.sp)
        }
    }
}

@Composable
fun ContinuingCard(
    title: String,
    imageUrl: String,
    chapter: String,
    progress: Float,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(280.dp)
            .height(160.dp)
            .padding(horizontal = 8.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark)
    ) {
        Row(modifier = Modifier.fillMaxSize()) {
            AsyncImage(
                model = imageUrl,
                contentDescription = title,
                modifier = Modifier
                    .fillMaxHeight()
                    .width(110.dp)
                    .clip(RoundedCornerShape(20.dp)),
                contentScale = ContentScale.Crop
            )
            
            Column(
                modifier = Modifier
                    .padding(12.dp)
                    .fillMaxHeight(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        title,
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        chapter,
                        color = PurpleAccent,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
                
                Column {
                    LinearProgressIndicator(
                        progress = progress,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = PurplePrimary,
                        trackColor = Color.White.copy(alpha = 0.1f)
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "%${(progress * 100).toInt()} okundu",
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}
