import { GradientBackground } from '@/components/GradientBackground';
import { HeroBanner } from '@/components/HeroBanner';
import { NetflixHomeRow } from '@/components/NetflixHomeRow';
import { HomeSkeleton } from '@/components/Skeleton';
import { useNetflixHome } from '@/hooks/useNetflixHome';
import { useStreamingActions } from '@/hooks/useCatalog';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { data, isLoading, loadMoreRow } = useNetflixHome();
  const { toggleMyList } = useStreamingActions();

  if (isLoading || !data) return <HomeSkeleton />;

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <HeroBanner item={data.hero} onToggleMyList={toggleMyList} />
        <View style={styles.rows}>
          {data.rows.map((row) => (
            <NetflixHomeRow key={row.id} row={row} onLoadMore={loadMoreRow} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 54, paddingBottom: 120 },
  rows: { paddingLeft: 18 },
});
