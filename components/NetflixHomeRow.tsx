import { PosterCard } from '@/components/PosterCard';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { spacing } from '@/design/tokens';
import { useImagePrefetch } from '@/hooks/useImagePrefetch';
import { NetflixHomeRowModel } from '@/hooks/useNetflixHome';
import { ContentItem } from '@/types/content';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, ViewToken } from 'react-native';

interface NetflixHomeRowProps {
  row: NetflixHomeRowModel;
  onLoadMore?: (row: NetflixHomeRowModel, cursor?: string) => Promise<{ items: ContentItem[]; nextCursor?: string }>;
}

export function NetflixHomeRow({ row, onLoadMore }: NetflixHomeRowProps) {
  const [items, setItems] = useState(row.items);
  const [nextCursor, setNextCursor] = useState(row.nextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const prefetch = useImagePrefetch({ cachePolicy: 'memory-disk', priority: 'normal' });
  const itemLength = (row.variant === 'landscape' || row.variant === 'continueWatching' ? 246 : 142) + spacing.md;

  useEffect(() => {
    setItems(row.items);
    setNextCursor(row.nextCursor);
  }, [row.id, row.items, row.nextCursor]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 35, minimumViewTime: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    prefetch(viewableItems.flatMap(({ item }) => {
      const content = item as ContentItem;
      return [content.posterUrl, content.backdropUrl];
    }));
  }).current;

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore || !onLoadMore) return;
    setIsLoadingMore(true);
    try {
      const page = await onLoadMore(row, nextCursor);
      setItems((current) => {
        const existing = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !existing.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader title={row.title} action={nextCursor ? 'More loading' : undefined} />
      <FlatList
        horizontal
        data={items}
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.55}
        ListFooterComponent={isLoadingMore ? <Skeleton style={row.variant === 'landscape' ? styles.landscapeSkeleton : styles.posterSkeleton} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 30 },
  list: { paddingRight: 18 },
  posterSkeleton: { width: 142, height: 214, marginLeft: spacing.md },
  landscapeSkeleton: { width: 246, height: 148, marginLeft: spacing.md },
});
