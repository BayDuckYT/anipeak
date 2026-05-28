package com.mahorapeak.manga.ui.premium

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mahorapeak.manga.ui.theme.*

@Composable
fun PremiumScreen(onBack: () -> Unit) {
    Scaffold(
        containerColor = BackgroundDark,
        topBar = {
            IconButton(onClick = onBack, modifier = Modifier.padding(16.dp)) {
                Icon(Icons.Default.Close, contentDescription = null, tint = TextPrimary)
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            item {
                Icon(
                    Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = PurplePrimary,
                    modifier = Modifier.size(64.dp)
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "MahoraPeak Premium",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary
                )
                Text(
                    "Sınırsız oku, reklamsız deneyimle!",
                    fontSize = 14.sp,
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(32.dp))
            }

            item {
                PremiumFeatures()
                Spacer(Modifier.height(32.dp))
            }

            item {
                SubscriptionPlans()
                Spacer(Modifier.height(32.dp))
            }

            item {
                Button(
                    onClick = {},
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PurplePrimary),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Premium'a Geç", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

@Composable
fun PremiumFeatures() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FeatureItem(Icons.Default.Block, "Reklamsız okuma")
        FeatureItem(Icons.Default.Bolt, "Erken erişim (yeni bölümler)")
        FeatureItem(Icons.Default.Star, "Özel rozetler & simgeler")
        FeatureItem(Icons.Default.HighQuality, "HD & Full HD kalite")
        FeatureItem(Icons.Default.CloudDownload, "İndirme & çevrimdışı okuma")
        FeatureItem(Icons.Default.SupportAgent, "7/24 öncelikli destek")
    }
}

@Composable
fun FeatureItem(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Icon(icon, contentDescription = null, tint = PurplePrimary, modifier = Modifier.size(24.dp))
        Spacer(Modifier.width(16.dp))
        Text(text, color = TextPrimary, fontSize = 15.sp)
    }
}

@Composable
fun SubscriptionPlans() {
    var selectedPlan by remember { mutableStateOf(1) }
    
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        PlanCard(
            title = "Aylık",
            price = "₺39,99",
            period = "/ay",
            selected = selectedPlan == 0,
            onClick = { selectedPlan = 0 },
            modifier = Modifier.weight(1f)
        )
        PlanCard(
            title = "Yıllık",
            price = "₺299,99",
            period = "/yıl",
            selected = selectedPlan == 1,
            onClick = { selectedPlan = 1 },
            isBestValue = true,
            modifier = Modifier.weight(1f)
        )
        PlanCard(
            title = "Ömür Boyu",
            price = "₺999,99",
            period = "Tek seferlik",
            selected = selectedPlan == 2,
            onClick = { selectedPlan = 2 },
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun PlanCard(
    title: String,
    price: String,
    period: String,
    selected: Boolean,
    onClick: () -> Unit,
    isBestValue: Boolean = false,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (selected) PurplePrimary.copy(alpha = 0.1f) else SurfaceDark)
            .border(
                2.dp,
                if (selected) PurplePrimary else Color.Transparent,
                RoundedCornerShape(16.dp)
            )
            .clickable { onClick() }
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (isBestValue) {
                Text(
                    "%30 İndirim",
                    fontSize = 10.sp,
                    color = PurpleAccent,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .background(PurplePrimary.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                )
                Spacer(Modifier.height(4.dp))
            }
            Text(title, color = TextSecondary, fontSize = 12.sp)
            Text(price, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text(period, color = TextSecondary, fontSize = 10.sp)
        }
    }
}
