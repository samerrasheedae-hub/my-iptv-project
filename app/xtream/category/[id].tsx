import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { XtreamStreamCard } from '@/components/xtream/XtreamStreamCard';
import { colors, radius, typography } from '@/design/tokens';
import { useXtreamCategoryStreams } from '@/hooks/useXtreamCategoryStreams';
import { XtreamContentKind } from '@/xtream/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const isKind = (value?: string): value is XtreamContentKind => value === 'live' || value === 'movie' || value === 'series';

const titleFor: Record<XtreamContentKind, string> = {
  live: 'Live TV',
  movie: 'Movies',
  series: 'Series',
};

export default function XtreamCategoryStreamsScreen() {
  const params = useLocalSearchParams<{ id: string; playlistId?: string; kind?: string; title?: string }>();
  const kind = isKind(params.kind) ? params.kind : undefined;
  const categoryTitle = params.title ? decodeURIComponent(params.title) : titleFor[kind ?? 'live'];
  const { items, isLoading, isLoadingMore, error, loadMore, refresh, hasMore } = useXtreamCategoryStreams({
    playlistId: params.playlistId,
    categoryId: params.id,
    kind,
  });

  if (!params.playlistId || !params.id || !kind) {
    return (
      <Screen>
        <PageHeader title="Category unavailable" subtitle="Missing category routing information." />
        <EmptyState icon="alert-circle" title="Cannot open category" message="The category link is missing required Xtream metadata." />
      </Screen>
    );
  }

  if (isLoading && !items.length) {
    return (
      <Screen>
        <PageHeader title={categoryTitle} subtitle="Loading this category only. The full playlist is not downloaded." />
        {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} style={styles.skeletonCard} />)}
      </Screen>
    );
  }

  if (error && !items.length) {
    return (
      <Screen>
        <PageHeader title={categoryTitle} subtitle="We could not load streams for this category." />
        <EmptyState icon="alert-circle" title="Streams unavailable" message={error.message} actionLabel="Try Again" />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <XtreamStreamCard stream={item} kind={kind} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <PageHeader title={categoryTitle} subtitle={`${titleFor[kind]} · Loaded on demand by category`} />
            <View style={styles.infoPill}>
              <Ionicons name="flash" size={13} color={colors.textMuted} />
              <Text style={styles.infoText}>Category-level loading · {items.length} loaded{hasMore ? ' · more available' : ''}</Text>
            </View>
            {error ? (
              <View style={styles.inlineError}>
                <Ionicons name="alert-circle" size={16} color={colors.primary} />
                <Text style={styles.inlineErrorText}>{error.message}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={<EmptyState icon="albums" title="No streams found" message="This category returned no streams." />}
        ListFooterComponent={isLoadingMore ? <Skeleton style={styles.footerSkeleton} /> : <View style={styles.footerSpace} />}
        onEndReached={() => { if (hasMore) void loadMore(); }}
        onEndReachedThreshold={0.65}
        refreshing={false}
        onRefresh={refresh}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        updateCellsBatchingPeriod={40}
        windowSize={9}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: 116, offset: 116 * index, index })}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 120 },
  skeletonCard: { height: 104, borderRadius: radius.lg, marginBottom: 12 },
  footerSkeleton: { height: 74, borderRadius: radius.lg, marginTop: 8 },
  footerSpace: { height: 30 },
  infoPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 11, paddingVertical: 7, marginBottom: 14 },
  infoText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(229,9,20,0.1)', borderWidth: 1, borderColor: 'rgba(229,9,20,0.25)', borderRadius: radius.lg, padding: 12, marginBottom: 14 },
  inlineErrorText: { flex: 1, color: colors.text, fontSize: typography.caption, fontWeight: '800' },
});
