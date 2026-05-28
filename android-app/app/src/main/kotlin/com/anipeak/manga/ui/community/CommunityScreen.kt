package com.mahorapeak.manga.ui.community

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.mahorapeak.manga.ui.theme.*

@Composable
fun CommunityScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Akış", "Popüler", "Takip Edilen")

    Scaffold(
        containerColor = BackgroundDark,
        floatingActionButton = {
            FloatingActionButton(
                onClick = {},
                containerColor = PurplePrimary,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Edit, contentDescription = "Post")
            }
        },
        topBar = {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Topluluk",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(Modifier.height(16.dp))
                ScrollableTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.Transparent,
                    contentColor = PurplePrimary,
                    edgePadding = 0.dp,
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
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(10) { index ->
                CommunityPostItem(
                    userName = if (index % 2 == 0) "ShadowX" else "HunterY",
                    time = "${index + 1} saat önce",
                    content = if (index % 2 == 0) 
                        "Solo Leveling'in son bölümü müthişti! Sizce Jinwoo'nun gücü nereye kadar ulaşacak? 🔥" 
                        else "Bu bölümdeki savaş sahneleri inanılmazdı! Çizimler her geçen gün daha da güzelleşiyor.",
                    imageUrl = if (index % 3 == 0) "https://images.unsplash.com/photo-1613376023733-0d743de236ca?auto=format&fit=crop&q=80&w=1000" else null,
                    likes = 120 + index * 5,
                    comments = 18 + index
                )
            }
        }
    }
}

@Composable
fun CommunityPostItem(
    userName: String,
    time: String,
    content: String,
    imageUrl: String?,
    likes: Int,
    comments: Int
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(PurplePrimary.copy(alpha = 0.2f))
                ) {
                    AsyncImage(
                        model = "https://i.pravatar.cc/100?u=$userName",
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(userName, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(time, color = TextSecondary, fontSize = 11.sp)
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = {}) {
                    Icon(Icons.Default.MoreHoriz, contentDescription = null, tint = TextSecondary)
                }
            }
            
            Spacer(Modifier.height(12.dp))
            
            Text(content, color = TextPrimary, fontSize = 14.sp, lineHeight = 20.sp)
            
            imageUrl?.let {
                Spacer(Modifier.height(12.dp))
                AsyncImage(
                    model = it,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(16.dp)),
                    contentScale = ContentScale.Crop
                )
            }
            
            Spacer(Modifier.height(16.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                PostAction(Icons.Default.Favorite, likes.toString(), Color.Red)
                Spacer(Modifier.width(20.dp))
                PostAction(Icons.Default.Comment, comments.toString(), PurpleAccent)
                Spacer(Modifier.weight(1f))
                IconButton(onClick = {}) {
                    Icon(Icons.Default.Share, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}

@Composable
fun PostAction(icon: ImageVector, count: String, tint: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = tint.copy(alpha = 0.8f), modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(6.dp))
        Text(count, color = TextSecondary, fontSize = 13.sp)
    }
}
