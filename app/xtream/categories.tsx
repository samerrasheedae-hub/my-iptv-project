import { AnimatedPressable } from '@/components/AnimatedPressable';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { XtreamAccountStatusCard } from '@/components/xtream/XtreamAccountStatusCard';
import { XtreamCategorySection } from '@/components/xtream/XtreamCategorySection';
import { colors, radius, typography } from '@/design/tokens';
import { useXtreamCategories } from '@/hooks/useXtreamCategories';
import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function XtreamCategoriesScreen() {
  const { account, session, storedAccount, isAuthenticated, isRestoring, error: runtimeError, restoreSession } = useXtreamRuntime();
  const { data, isLoading, isRefreshing, error } = useXtreamCategories();

  if (isRestoring || (isLoading && !data)) {
    return (
      <Screen>
        <PageHeader title="Xtream" subtitle="Loading cached account and category index." />
        <Skeleton style={styles.statusSkeleton} />
        {[0, 1, 2].map((section) => (
          <View key={section} style={styles.skeletonSection}>
            <Skeleton style={styles.headingSkeleton} />
            <View style={styles.skeletonRow}>
              {[0, 1].map((item) => <Skeleton key={item} style={styles.cardSkeleton} />)}
            </View>
          </View>
        ))}
      </Screen>
    );
  }

  if (!isAuthenticated && !storedAccount) {
    return (
      <Screen>
        <PageHeader title="Xtream" subtitle="Connect your Xtream account to browse categories." />
        <EmptyState icon="log-in" title="No Xtream account" message="Add your server URL, username, and password to load categories securely." />
        <AnimatedPressable style={styles.primaryButton} onPress={() => router.push('/xtream/login')}>
          <Ionicons name="add-circle" size={20} color={colors.text} />
          <Text style={styles.primaryText}>Connect Xtream Account</Text>
        </AnimatedPressable>
      </Screen>
    );
  }

  if ((error || runtimeError) && !data?.totalCount) {
    return (
      <Screen>
        <PageHeader title="Xtream" subtitle="We could not load your category index." />
        <XtreamAccountStatusCard account={account} session={session} username={storedAccount?.username} />
        <EmptyState icon="alert-circle" title="Categories unavailable" message={(error?.message ?? runtimeError) || 'Check your server URL, account status, and network connection.'} />
        <AnimatedPressable style={styles.primaryButton} onPress={() => restoreSession()}>
          <Ionicons name="refresh" size={20} color={colors.text} />
          <Text style={styles.primaryText}>Try Again</Text>
        </AnimatedPressable>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerWrap}>
          <PageHeader title="Xtream Categories" subtitle="Streams are not loaded here. Open a category later to load only that category." />
          <XtreamAccountStatusCard account={account} session={session} username={storedAccount?.username} />
          {isRefreshing ? (
            <View style={styles.refreshPill}>
              <Ionicons name="sync" size={13} color={colors.textMuted} />
              <Text style={styles.refreshText}>Refreshing cached categories</Text>
            </View>
          ) : null}
        </View>

        {data?.totalCount ? (
          <View style={styles.rows}>
            {data.groups.map((group) => (
              <XtreamCategorySection key={group.kind} title={group.title} kind={group.kind} categories={group.categories} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState icon="albums" title="No categories found" message="Your Xtream account returned no categories." />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 120 },
  headerWrap: { paddingTop: 4 },
  rows: { paddingLeft: 0 },
  statusSkeleton: { height: 82, borderRadius: radius.xl, marginBottom: 24 },
  skeletonSection: { marginBottom: 28 },
  headingSkeleton: { height: 22, width: 190, marginBottom: 12 },
  skeletonRow: { flexDirection: 'row', gap: 12 },
  cardSkeleton: { width: 206, height: 132, borderRadius: radius.lg },
  primaryButton: { height: 54, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 20 },
  primaryText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  refreshPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 11, paddingVertical: 7, marginBottom: 18 },
  refreshText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
  emptyWrap: { paddingTop: 28 },
});
