import { ContentGrid } from '@/components/ContentGrid';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { Skeleton } from '@/components/Skeleton';
import { useSearch } from '@/hooks/useCatalog';
import { useState } from 'react';
import { View } from 'react-native';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearch(query);

  return (
    <Screen>
      <PageHeader title="Search" subtitle="Find premium live experiences, movies, and series from the future catalog." />
      <SearchField value={query} onChangeText={setQuery} />
      {isLoading || !data ? (
        <View style={{ gap: 16 }}>
          {[0, 1, 2].map((key) => <Skeleton key={key} style={{ height: 214 }} />)}
        </View>
      ) : data.length ? (
        <ContentGrid items={data} />
      ) : (
        <EmptyState icon="search" title="No results" message="Try searching by title, category, or content type." />
      )}
    </Screen>
  );
}
