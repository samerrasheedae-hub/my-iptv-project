import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ProgressiveImage } from '@/components/images/ProgressiveImage';
import { colors, radius, typography } from '@/design/tokens';
import { M3UStreamMetadata } from '@/m3u/types';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export function M3UStreamCard({ stream }: { stream: M3UStreamMetadata }) {
  return (
    <Link href={{ pathname: '/player/[id]', params: { id: stream.id, providerKind: 'm3u', playlistId: stream.playlistId, streamId: stream.id, categoryId: stream.categoryId, mediaKind: stream.kind === 'unknown' ? 'live' : stream.kind } }} asChild>
      <AnimatedPressable style={styles.card}>
        <View style={styles.logoShell}>
          {stream.logoUrl ? <ProgressiveImage uri={stream.logoUrl} style={styles.logo} recyclingKey={`m3u-${stream.id}`} /> : <Ionicons name="radio" size={26} color={colors.textMuted} />}
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={2} style={styles.title}>{stream.title}</Text>
          <Text numberOfLines={1} style={styles.meta}>{stream.groupTitle} · {stream.kind === 'unknown' ? 'stream' : stream.kind}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      </AnimatedPressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 92, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12 },
  logoShell: { width: 62, height: 62, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 62, height: 62 },
  copy: { flex: 1, gap: 7 },
  title: { color: colors.text, fontSize: typography.body, lineHeight: 20, fontWeight: '900' },
  meta: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
});
