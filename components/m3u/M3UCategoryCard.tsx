import { AnimatedPressable } from '@/components/AnimatedPressable';
import { colors, radius, shadows, typography } from '@/design/tokens';
import { M3UCategory } from '@/m3u/types';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export function M3UCategoryCard({ category }: { category: M3UCategory }) {
  return (
    <Link href={{ pathname: '/m3u/category/[id]', params: { id: category.id, playlistId: category.playlistId, title: category.title } }} asChild>
      <AnimatedPressable style={styles.card}>
        <View style={styles.icon}><Ionicons name="folder" size={25} color={colors.text} /></View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={styles.title}>{category.title}</Text>
          <Text style={styles.meta}>{category.itemCountEstimate ? `${category.itemCountEstimate}+ items` : 'Group'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      </AnimatedPressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 92, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, ...shadows.card },
  icon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(229,9,20,0.86)' },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  meta: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800', marginTop: 5 },
});
