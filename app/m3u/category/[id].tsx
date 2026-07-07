import { EmptyState } from '@/components/EmptyState';
import { M3UStreamCard } from '@/components/m3u/M3UStreamCard';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { colors, radius, typography } from '@/design/tokens';
import { useM3UCategoryStreams } from '@/hooks/useM3UCategoryStreams';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function M3UCategoryStreamsScreen() {
  const params = useLocalSearchParams<{ id: string; playlistId?: string; title?: string }>();
  const title = params.title ? decodeURIComponent(params.title) : 'M3U Group';
  const { items, isLoading, isLoadingMore, error, loadMore, refresh, hasMore } = useM3UCategoryStreams({ playlistId: params.playlistId, categoryId: params.id });

  if (!params.playlistId || !params.id) {
    return (
      <Screen>
        <PageHeader title="Group unavailable" subtitle="Missing M3U category routing information." />
        <EmptyState icon="alert-circle" title="Cannot open group" message="The group link is missing required M3U metadata." />
      </Screen>
    );
  }

  if (isLoading && !items.length) {
    return (
      <Screen>
        <PageHeader title={title} subtitle="Loading streams for this group only." />
        {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} style={styles.skeletonCard} />)}
      </Screen>
    );
  }

  if (error && !items.length) {
    return (
      <Screen>
        <PageHeader title={title} subtitle="We could not load streams for this group." />
        <EmptyState icon="alert-circle" title="Streams unavailable" message={error.message} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <M3UStreamCard stream={item} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <PageHeader title={title} subtitle="M3U streams · Loaded on demand by group" />
            <View style={styles.infoPill}>
              <Ionicons name="flash" size={13} color={colors.textMuted} />
              <Text style={styles.infoText}>Category-level loading · {items.length} loaded{hasMore ? ' · more available' : ''}</Text>
            </View>
            {error ? <View style={styles.inlineError}><Ionicons name="alert-circle" size={16} color={colors.primary} /><Text style={styles.inlineErrorText}>{error.message}</Text></View> : null}
          </View>
        }
        ListEmptyComponent={<EmptyState icon="radio" title="No streams found" message="This group returned no streams." />}
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
        getItemLayout={(_, index) => ({ length: 104, offset: 104 * index, index })}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 120 },
  skeletonCard: { height: 92, borderRadius: radius.lg, marginBottom: 12 },
  footerSkeleton: { height: 74, borderRadius: radius.lg, marginTop: 8 },
  footerSpace: { height: 30 },
  infoPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 11, paddingVertical: 7, marginBottom: 14 },
  infoText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(229,9,20,0.1)', borderWidth: 1, borderColor: 'rgba(229,9,20,0.25)', borderRadius: radius.lg, padding: 12, marginBottom: 14 },
  inlineErrorText: { flex: 1, color: colors.text, fontSize: typography.caption, fontWeight: '800' },
});
