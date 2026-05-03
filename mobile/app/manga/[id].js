import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Bookmark, Share2, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function MangaDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [series, setSeries] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      // Seriyi çek
      const { data: sData } = await supabase.from('series').select('*').eq('id', id).single();
      // Bölümleri çek
      const { data: cData } = await supabase.from('chapters').select('*').eq('series_id', id).order('number', { ascending: false });
      
      setSeries(sData);
      setChapters(cData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Image source={{ uri: series?.cover }} style={styles.coverImage} />
          <View style={styles.heroOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.seriesInfo}>
              <Text style={styles.title}>{series?.title}</Text>
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Star size={14} color={theme.colors.accent} fill={theme.colors.accent} />
                  <Text style={styles.statText}>4.9</Text>
                </View>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statText}>{series?.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.readButton} onPress={() => chapters[0] && router.push(`/reader/${chapters[chapters.length-1].id}`)}>
            <Play size={20} color="#fff" fill="#fff" />
            <Text style={styles.readButtonText}>İlk Bölümü Oku</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Bookmark size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Share2 size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Özet</Text>
          <Text style={styles.description} numberOfLines={4}>
            {series?.description || 'Bu seri için henüz bir özet girilmemiş.'}
          </Text>
        </View>

        {/* Chapter List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bölümler</Text>
            <Text style={styles.chapterCount}>{chapters.length} Bölüm</Text>
          </View>
          
          <View style={styles.chapterList}>
            {chapters.map((ch) => (
              <TouchableOpacity 
                key={ch.id} 
                style={styles.chapterItem}
                onPress={() => router.push(`/reader/${ch.id}`)}
              >
                <View>
                  <Text style={styles.chapterNumber}>Bölüm {ch.number}</Text>
                  <Text style={styles.chapterDate}>Bugün</Text>
                </View>
                <ChevronLeft size={20} color={theme.colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    height: 450,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  seriesInfo: {
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  statDivider: {
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginTop: -30,
    alignItems: 'center',
  },
  readButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.roundness.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  readButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  iconButton: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: 8,
  },
  section: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  chapterCount: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  chapterList: {
    marginTop: 8,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.roundness.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chapterNumber: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  chapterDate: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  }
});
