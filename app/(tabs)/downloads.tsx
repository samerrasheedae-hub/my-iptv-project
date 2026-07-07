import { ContentGrid } from '@/components/ContentGrid';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { useDownloads } from '@/hooks/useCatalog';
import { View } from 'react-native';

export default function DownloadsScreen() {
  const { data, isLoading } = useDownloads();

  return (
    <Screen>
      <PageHeader title="Downloads" subtitle="Offline UI states are ready; download storage and entitlement logic can be added later." />
      {isLoading || !data ? (
        <View style={{ gap: 16 }}><Skeleton style={{ height: 214 }} /><Skeleton style={{ height: 214 }} /></View>
      ) : data.length ? (
        <ContentGrid items={data} />
      ) : (
        <EmptyState icon="download" title="No downloads yet" message="Downloaded content will be available from this page once media services are implemented." />
      )}
    </Screen>
  );
}
