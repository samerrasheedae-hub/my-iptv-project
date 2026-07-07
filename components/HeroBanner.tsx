import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ProgressiveImage } from '@/components/images/ProgressiveImage';
import { colors, radius, shadows, spacing, typography } from '@/design/tokens';
import { ContentItem } from '@/types/content';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export function HeroBanner({ item, onToggleMyList }: { item: ContentItem; onToggleMyList?: (id: string) => void }) {
  return (
    <View style={styles.container}>
      <ProgressiveImage uri={item.backdropUrl} thumbnailUri={item.posterUrl} style={StyleSheet.absoluteFillObject} recyclingKey={`hero-${item.id}`} accessibilityLabel={item.title} />
      <LinearGradient colors={['transparent', 'rgba(5,5,9,0.65)', '#050509']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.brandRow}>
        <View style={styles.logoMark}><Text style={styles.logoText}>P</Text></View>
        <Text style={styles.brandText}>Premium IPTV</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.pill}><Text style={styles.pillText}>Featured Experience</Text></View>
        <Text style={styles.title}>{item.title}</Text>
        <Text numberOfLines={2} style={styles.overview}>{item.overview}</Text>
        <View style={styles.facts}>
          {[item.year, item.maturityRating, item.durationLabel].filter(Boolean).map((fact) => (
            <Text key={fact} style={styles.fact}>{fact}</Text>
          ))}
        </View>
        <View style={styles.actions}>
          <Link href={{ pathname: '/player/[id]', params: { id: item.id, ...item.playerRouteContext } }} asChild>
            <AnimatedPressable style={styles.playButton}>
              <Ionicons name="play" size={20} color={colors.background} />
              <Text style={styles.playText}>Play</Text>
            </AnimatedPressable>
          </Link>
          <AnimatedPressable style={styles.secondaryButton} onPress={() => onToggleMyList?.(item.id)}>
            <Ionicons name={item.isInMyList ? "checkmark" : "add"} size={21} color={colors.text} />
            <Text style={styles.secondaryText}>{item.isInMyList ? "Saved" : "My List"}</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 500,
    marginHorizontal: 18,
    marginBottom: 28,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  brandRow: { position: 'absolute', top: 18, left: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.text, fontWeight: '900', fontSize: 20 },
  brandText: { color: colors.text, fontWeight: '800', fontSize: typography.body },
  content: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xl },
  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 10 },
  pillText: { color: colors.text, fontSize: typography.caption, fontWeight: '800' },
  title: { color: colors.text, fontSize: 42, lineHeight: 44, fontWeight: '900', letterSpacing: -1.4 },
  overview: { color: colors.textMuted, fontSize: typography.body, lineHeight: 21, marginTop: 10 },
  facts: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  fact: { color: colors.text, fontSize: typography.caption, fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.full },
  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  playButton: { flex: 1, height: 52, borderRadius: radius.full, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  playText: { color: colors.background, fontSize: typography.body, fontWeight: '900' },
  secondaryButton: { flex: 1, height: 52, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
});
