import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Crown, Flame } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.brand}>AniPeak <Flame size={20} color={theme.colors.primary} fill={theme.colors.primary} /></Text>
          </View>
          <TouchableOpacity style={styles.premiumBadge}>
            <Crown size={16} color={theme.colors.accent} />
            <Text style={styles.premiumText}>Elite</Text>
          </TouchableOpacity>
        </View>

        {/* Trending Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trend Manga'lar</Text>
            <TouchableOpacity><Text style={styles.seeAll}>Tümünü Gör</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList}>
            {[1, 2, 3].map((i) => (
              <TouchableOpacity key={i} style={styles.trendingCard}>
                <Image 
                  source={{ uri: `https://picsum.photos/seed/${i}/400/600` }} 
                  style={styles.trendingImage} 
                />
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardTitle} numberOfLines={2}>Siber Şövalye: Bölüm 42</Text>
                  <View style={styles.tag}>
                    <Zap size={12} color="#fff" />
                    <Text style={styles.tagText}>Yeni</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Latest Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Güncellemeler</Text>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} style={styles.updateCard}>
              <Image 
                source={{ uri: `https://picsum.photos/seed/u${i}/200/200` }} 
                style={styles.updateImage} 
              />
              <View style={styles.updateInfo}>
                <Text style={styles.updateTitle} numberOfLines={1}>Solo Leveling: Ragnarok</Text>
                <Text style={styles.updateChapter}>Bölüm {100 + i}</Text>
                <Text style={styles.updateTime}>2 saat önce</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  greeting: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  brand: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  premiumBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  premiumText: {
    color: theme.colors.accent,
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 12,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: theme.spacing.md,
  },
  seeAll: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  trendingList: {
    paddingLeft: theme.spacing.md,
  },
  trendingCard: {
    width: width * 0.45,
    height: 250,
    marginRight: theme.spacing.md,
    borderRadius: theme.roundness.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  updateCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.roundness.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  updateImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  updateInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  updateTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  updateChapter: {
    color: theme.colors.primary,
    fontSize: 13,
    marginTop: 2,
  },
  updateTime: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  }
});
