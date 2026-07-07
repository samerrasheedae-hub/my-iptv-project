import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ProgressiveImage } from '@/components/images/ProgressiveImage';
import { colors, radius, typography } from '@/design/tokens';
import { XtreamContentKind, XtreamStreamSummary } from '@/xtream/types';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  stream: XtreamStreamSummary;
  kind: XtreamContentKind;
}

const iconFor: Record<XtreamContentKind, keyof typeof Ionicons.glyphMap> = {
  live: 'radio',
  movie: 'film',
  series: 'albums',
};

const labelFor: Record<XtreamContentKind, string> = {
  live: 'Live TV',
  movie: 'Movie',
  series: 'Series',
};

export function XtreamStreamCard({ stream, kind }: Props) {
  return (
    <Link
      href={{
        pathname: '/player/[id]',
        params: {
          id: stream.id,
          providerKind: 'xtream',
          playlistId: stream.playlistId,
          streamId: stream.id,
          categoryId: stream.categoryId,
          mediaKind: kind,
        },
      }}
      asChild
    >
      <AnimatedPressable style={styles.card}>
        <View style={styles.posterShell}>
          {stream.posterUrl || stream.backdropUrl ? (
            <ProgressiveImage uri={stream.posterUrl ?? stream.backdropUrl} thumbnailUri={stream.backdropUrl ?? stream.posterUrl} style={styles.poster} recyclingKey={`xtream-${stream.id}`} />
          ) : (
            <View style={styles.posterFallback}>
              <Ionicons name={iconFor[kind]} size={28} color={colors.textMuted} />
            </View>
          )}
          {kind === 'live' ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={2} style={styles.title}>{stream.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name={iconFor[kind]} size={13} color={colors.primary} />
            <Text numberOfLines={1} style={styles.meta}>{stream.releaseYear ? `${labelFor[kind]} · ${stream.releaseYear}` : labelFor[kind]}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      </AnimatedPressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 104, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12 },
  posterShell: { width: 72, height: 84, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceSoft },
  poster: { width: 72, height: 84 },
  posterFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 8 },
  title: { color: colors.text, fontSize: typography.body, lineHeight: 20, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
  liveBadge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.text },
  liveText: { color: colors.text, fontSize: 9, fontWeight: '900' },
});
