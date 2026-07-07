import { colors, radius, typography } from '@/design/tokens';
import { M3USourceDescriptor } from '@/m3u/types';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function M3USourceStatusCard({ source }: { source?: M3USourceDescriptor }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconShell}><Ionicons name="list-circle" size={26} color={colors.text} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{source?.displayName ?? 'M3U Source'}</Text>
        <Text style={styles.subtitle}>{source ? `${source.kind === 'remote_url' ? 'Remote URL' : 'Local file'} · Registered` : 'No source connected'}</Text>
      </View>
      {source ? <Text style={styles.pill}>M3U</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 18 },
  iconShell: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  copy: { flex: 1 },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700', marginTop: 4 },
  pill: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '900', backgroundColor: colors.surfaceSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 7 },
});
