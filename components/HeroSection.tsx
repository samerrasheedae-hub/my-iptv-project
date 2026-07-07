import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { colors } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface HeroItem {
  id: string;
  title: string;
  genre?: string;
  year?: string;
  description?: string;
  image?: string;
}

interface HeroSectionProps {
  item: HeroItem;
  onWatchNow: () => void;
  onDetails: () => void;
  onMyList?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function HeroSection({ item, onWatchNow, onDetails, onMyList, onDownload, onShare }: HeroSectionProps) {
  const heroImage = item.image || 'https://picsum.photos/id/1015/720/400';

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: heroImage }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Recommended for You</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

        {(item.genre || item.year) && (
          <Text style={styles.subtitle}>{item.genre} • {item.year}</Text>
        )}

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}

        {/* Main Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.watchNowButton} 
            onPress={onWatchNow}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={18} color="#000" />
            <Text style={styles.watchNowText}>Watch Now</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.detailsButton} 
            onPress={onDetails}
            activeOpacity={0.85}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.text} />
            <Text style={styles.detailsText}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions - Smaller & more premium */}
        <View style={styles.quickActionsPill}>
          <TouchableOpacity style={styles.quickBtn} onPress={onMyList}>
            <Ionicons name="heart-outline" size={13} color={colors.text} />
            <Text style={styles.quickText}>My List</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={onDownload}>
            <Ionicons name="download-outline" size={13} color={colors.text} />
            <Text style={styles.quickText}>Download</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={onShare}>
            <Ionicons name="share-outline" size={13} color={colors.text} />
            <Text style={styles.quickText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: width * 1.12,
    marginBottom: 4,
    backgroundColor: '#111',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '82%',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 6,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  watchNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.buttonPrimary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 30,
    gap: 8,
    elevation: 4,
  },
  watchNowText: {
    color: colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 30,
    gap: 8,
  },
  detailsText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Compact premium pill
  quickActionsPill: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  quickBtn: {
    alignItems: 'center',
    gap: 0,
    paddingHorizontal: 18,
    paddingVertical: 1,
  },
  quickText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '500',
    marginTop: -1,
  },
});
