import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { theme } from '../../constants/theme';
import { ChevronLeft, Menu, Settings } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Reader() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  const fetchChapter = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*, series:series_id(title)')
        .eq('id', chapterId)
        .single();
      
      if (error) throw error;
      setChapter(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHeader = () => setShowHeader(!showHeader);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.seriesTitle} numberOfLines={1}>{chapter?.series?.title}</Text>
            <Text style={styles.chapterTitle}>Bölüm {chapter?.number}</Text>
          </View>
          <TouchableOpacity style={styles.backButton}>
            <Settings size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Manga Pages */}
      <FlatList
        data={chapter?.pages || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image 
            source={{ uri: item }} 
            style={styles.pageImage} 
            resizeMode="contain"
          />
        )}
        onScrollBeginDrag={toggleHeader}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={styles.footer}><Text style={styles.footerText}>Bölüm Sonu</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  seriesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chapterTitle: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  pageImage: {
    width: width,
    height: width * 1.5, // Otomatik oran ayarlanabilir, placeholder oran
  },
  footer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  }
});
