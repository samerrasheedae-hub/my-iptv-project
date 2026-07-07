import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ProgressiveImage } from '@/components/images/ProgressiveImage';
import { colors, radius, shadows, spacing, typography } from '@/design/tokens';
import { ContentItem, ContentRowModel } from '@/types/content';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

interface PosterCardProps {
  item: ContentItem;
  variant?: ContentRowModel['variant'];
}

export function PosterCard({ item, variant = 'poster' }: PosterCardProps) {
  const router = useRouter();
  const isLandscape = variant === 'landscape' || variant === 'continueWatching';
  const imageSource = isLandscape ? item.backdropUrl : item.posterUrl;

  const handlePress = () => {
    router.push({
      pathname: '/player/[id]',
      params: { id: item.id, ...(item.playerRouteContext || {}) },
    });
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.card, isLandscape ? styles.landscape : styles.poster]}
    >
      <ProgressiveImage
        uri={imageSource}
        thumbnailUri={item.backdropUrl}
        style={StyleSheet.absoluteFillObject}
        recyclingKey={item.id}
        accessibilityLabel={item.title}
      />
      <View style={styles.scrim} />
      {item.kind === 'live' ? (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      ) : null}
      {variant === 'continueWatching' && typeof item.progress === 'number' ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(item.progress * 100, 100)}%` }]} />
        </View>
      ) : null}
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
        <View style={styles.metaLine}>
          <Ionicons name={isLandscape ? 'play-circle' : 'star'} size={12} color={colors.primary} />
          <Text numberOfLines={1} style={styles.subtle}>{item.year ?? item.kind}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  poster: { width: 142, height: 214 },
  landscape: { width: 246, height: 148 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  meta: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
  title: { color: colors.text, fontWeight: '800', fontSize: typography.body, letterSpacing: -0.2 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  subtle: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700', textTransform: 'uppercase' },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(229,9,20,0.9)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text },
  liveText: { color: colors.text, fontWeight: '900', fontSize: 10, letterSpacing: 0.8 },
  progressTrack: { position: 'absolute', left: 12, right: 12, bottom: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.24)' },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: radius.full },
});
