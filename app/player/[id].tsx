import { PremiumPlayer } from '@/components/player/PremiumPlayer';
import { parsePlayerRouteContext } from '@/player/routeParams';
import { useLocalSearchParams } from 'expo-router';

export default function PlayerScreen() {
  const params = useLocalSearchParams<{
    id: string;
    providerKind?: string;
    playlistId?: string;
    streamId?: string;
    categoryId?: string;
    mediaKind?: string;
  }>();

  return <PremiumPlayer mediaId={params.id ?? ''} routeContext={parsePlayerRouteContext(params)} />;
}
