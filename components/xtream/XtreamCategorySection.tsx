import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, shadows, spacing, typography } from '@/design/tokens';
import { XtreamCategory, XtreamContentKind } from '@/xtream/types';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  kind: XtreamContentKind;
  categories: XtreamCategory[];
}

const iconFor: Record<XtreamContentKind, keyof typeof Ionicons.glyphMap> = {
  live: 'tv',
  movie: 'film',
  series: 'albums',
};

export function XtreamCategorySection({ title, kind, categories }: Props) {
  if (!categories.length) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={title} action={`${categories.length}`} />
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => `${kind}-${item.id}`}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <XtreamCategoryCard category={item} kind={kind} />}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        contentContainerStyle={styles.list}
        initialNumToRender={5}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: 218, offset: 218 * index, index })}
      />
    </View>
  );
}

function XtreamCategoryCard({ category, kind }: { category: XtreamCategory; kind: XtreamContentKind }) {
  return (
    <Link
      href={{
        pathname: '/xtream/category/[id]',
        params: { id: category.id, playlistId: category.playlistId, kind, title: category.title },
      }}
      asChild
    >
      <AnimatedPressable style={styles.card}>
        <View style={styles.cardIcon}>
          <Ionicons name={iconFor[kind]} size={28} color={colors.text} />
        </View>
        <Text numberOfLines={2} style={styles.cardTitle}>{category.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{category.itemCountEstimate ? `${category.itemCountEstimate}+ items` : 'Category'}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
        </View>
      </AnimatedPressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 30 },
  list: { paddingRight: 18 },
  card: { width: 206, height: 132, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, justifyContent: 'space-between', ...shadows.card },
  cardIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(229,9,20,0.86)' },
  cardTitle: { color: colors.text, fontSize: typography.h3, lineHeight: 22, fontWeight: '900', letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
});
