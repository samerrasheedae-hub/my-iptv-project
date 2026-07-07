import { ContentGrid } from '@/components/ContentGrid';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { useMyList } from '@/hooks/useCatalog';
import { View } from 'react-native';

export default function MyListScreen() {
  const { data, isLoading } = useMyList();

  return (
    <Screen>
      <PageHeader title="My List" subtitle="Saved titles will appear here when account and catalog services are connected." />
      {isLoading || !data ? (
        <View style={{ gap: 16 }}><Skeleton style={{ height: 214 }} /><Skeleton style={{ height: 214 }} /></View>
      ) : data.length ? (
        <ContentGrid items={data} />
      ) : (
        <EmptyState icon="bookmark" title="Your list is empty" message="Add movies, series, or live events to build a personal watchlist." actionLabel="Browse Home" />
      )}
    </Screen>
  );
}
