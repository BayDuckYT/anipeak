package com.anipeak.manga.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
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
import com.anipeak.manga.ui.theme.*

@Composable
fun ProfileScreen(onNavigateToPremium: () -> Unit) {
    Scaffold(
        containerColor = BackgroundDark
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            item {
                ProfileHeader(onNavigateToPremium)
            }
            
            item {
                ProfileStats()
            }
            
            item {
                Spacer(Modifier.height(24.dp))
                SettingsSection()
            }
            
            item {
                Spacer(Modifier.height(40.dp))
                Button(
                    onClick = {},
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ErrorRed.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Çıkış Yap", color = ErrorRed, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun ProfileHeader(onPremiumClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .border(2.dp, PurplePrimary, CircleShape)
        ) {
            AsyncImage(
                model = "https://i.pravatar.cc/300",
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }
        
        Spacer(Modifier.height(16.dp))
        
        Text(
            "ShadowX",
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            "Premium'a Geç",
            color = PurpleAccent,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(PurplePrimary.copy(alpha = 0.1f))
                .clickable { onPremiumClick() }
                .padding(horizontal = 12.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun ProfileStats() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        StatItem("128", "Okuduğum")
        StatItem("42", "Favorilerim")
        StatItem("76", "Yorumlarım")
    }
}

@Composable
fun StatItem(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Text(label, color = TextSecondary, fontSize = 12.sp)
    }
}

@Composable
fun SettingsSection() {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        SettingsItem(Icons.Default.Person, "Profil Düzenle")
        SettingsItem(Icons.Default.Settings, "Ayarlar")
        SettingsItem(Icons.Default.Notifications, "Bildirimler")
        SettingsItem(Icons.Default.CloudDownload, "İndirme Yönetimi")
        SettingsItem(Icons.Default.Security, "Gizlilik")
        SettingsItem(Icons.Default.Help, "Destek")
    }
}

@Composable
fun SettingsItem(icon: ImageVector, title: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable { }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = TextPrimary, modifier = Modifier.size(24.dp))
        Spacer(Modifier.width(16.dp))
        Text(title, color = TextPrimary, modifier = Modifier.weight(1f))
        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextSecondary)
    }
}
