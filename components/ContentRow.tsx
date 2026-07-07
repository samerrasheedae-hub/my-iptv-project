import { PosterCard } from '@/components/PosterCard';
import { SectionHeader } from '@/components/SectionHeader';
import { spacing } from '@/design/tokens';
import { useImagePrefetch } from '@/hooks/useImagePrefetch';
import { ContentItem, ContentRowModel } from '@/types/content';
import { FlatList, StyleSheet, View, ViewToken } from 'react-native';
import { useRef } from 'react';

export function ContentRow({ row }: { row: ContentRowModel }) {
  const prefetch = useImagePrefetch({ cachePolicy: 'memory-disk', priority: 'normal' });
  const itemLength = (row.variant === 'landscape' || row.variant === 'continueWatching' ? 246 : 142) + spacing.md;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 35, minimumViewTime: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    prefetch(viewableItems.flatMap(({ item }) => {
      const content = item as ContentItem;
      return [content.posterUrl, content.backdropUrl];
    }));
  }).current;

  return (
    <View style={styles.container}>
      <SectionHeader title={row.title} action="View all" />
      <FlatList
        horizontal
        data={row.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PosterCard item={item} variant={row.variant} />}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        contentContainerStyle={styles.list}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        getItemLayout={(_, index) => ({ length: itemLength, offset: itemLength * index, index })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 30 },
  list: { paddingRight: 18 },
});
