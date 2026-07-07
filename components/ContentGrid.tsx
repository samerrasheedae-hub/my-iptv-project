import { PosterCard } from '@/components/PosterCard';
import { spacing } from '@/design/tokens';
import { useImagePrefetch } from '@/hooks/useImagePrefetch';
import { ContentItem } from '@/types/content';
import { FlatList, StyleSheet, View, ViewToken } from 'react-native';
import { useRef } from 'react';

export function ContentGrid({ items }: { items: ContentItem[] }) {
  const prefetch = useImagePrefetch({ cachePolicy: 'memory-disk', priority: 'normal' });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 30, minimumViewTime: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    prefetch(viewableItems.flatMap(({ item }) => {
      const content = item as ContentItem;
      return [content.posterUrl, content.backdropUrl];
    }));
  }).current;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PosterCard item={item} />}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.columns}
      ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
      contentContainerStyle={styles.content}
      initialNumToRender={8}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={40}
      windowSize={7}
      removeClippedSubviews
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
    />
  );
}

const styles = StyleSheet.create({
  columns: { justifyContent: 'space-between' },
  content: { paddingBottom: 120 },
});
