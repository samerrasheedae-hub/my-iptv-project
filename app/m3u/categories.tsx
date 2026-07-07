import { AnimatedPressable } from '@/components/AnimatedPressable';
import { EmptyState } from '@/components/EmptyState';
import { M3UCategoryCard } from '@/components/m3u/M3UCategoryCard';
import { M3USourceStatusCard } from '@/components/m3u/M3USourceStatusCard';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { colors, radius, typography } from '@/design/tokens';
import { useM3UCategories } from '@/hooks/useM3UCategories';
import { useM3URuntime } from '@/providers/M3URuntimeProvider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function M3UCategoriesScreen() {
  const { source, isConnected, isRestoring, error: runtimeError, restoreSource } = useM3URuntime();
  const { data, isLoading, isRefreshing, error } = useM3UCategories();

  if (isRestoring || (isLoading && !data)) {
    return (
      <Screen>
        <PageHeader title="M3U" subtitle="Loading cached source and category index." />
        <Skeleton style={styles.statusSkeleton} />
        {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} style={styles.skeletonCard} />)}
      </Screen>
    );
  }

  if (!isConnected) {
    return (
      <Screen>
        <PageHeader title="M3U" subtitle="Add a remote URL or local file descriptor to browse groups." />
        <EmptyState icon="list" title="No M3U source" message="Register a playlist source. Categories are indexed before streams are loaded." />
        <AnimatedPressable style={styles.primaryButton} onPress={() => router.push('/m3u/source')}>
          <Ionicons name="add-circle" size={20} color={colors.text} />
          <Text style={styles.primaryText}>Add M3U Source</Text>
        </AnimatedPressable>
      </Screen>
    );
  }

  if ((error || runtimeError) && !data?.totalCount) {
    return (
      <Screen>
        <PageHeader title="M3U" subtitle="We could not load the category index." />
        <M3USourceStatusCard source={source} />
        <EmptyState icon="alert-circle" title="Categories unavailable" message={(error?.message ?? runtimeError) || 'Check the source and network connection.'} />
        <AnimatedPressable style={styles.primaryButton} onPress={() => restoreSource()}>
          <Ionicons name="refresh" size={20} color={colors.text} />
          <Text style={styles.primaryText}>Try Again</Text>
        </AnimatedPressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={data?.categories ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <M3UCategoryCard category={item} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <PageHeader title="M3U Categories" subtitle="Streams are loaded only after a group is opened." />
            <M3USourceStatusCard source={source} />
            {isRefreshing ? <View style={styles.refreshPill}><Ionicons name="sync" size={13} color={colors.textMuted} /><Text style={styles.refreshText}>Refreshing cached groups</Text></View> : null}
          </View>
        }
        ListEmptyComponent={<EmptyState icon="folder" title="No groups found" message="This source returned no category groups." />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={9}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: 104, offset: 104 * index, index })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 120 },
  statusSkeleton: { height: 82, borderRadius: radius.xl, marginBottom: 24 },
  skeletonCard: { height: 92, borderRadius: radius.lg, marginBottom: 12 },
  primaryButton: { height: 54, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 20 },
  primaryText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  refreshPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 11, paddingVertical: 7, marginBottom: 14 },
  refreshText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
});
