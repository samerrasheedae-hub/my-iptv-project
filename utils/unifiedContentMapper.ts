import { ContentItem } from '@/types/content';
import { UnifiedMediaItem } from '@/media/types';

const durationLabel = (seconds?: number) => {
  if (!seconds) return undefined;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export function unifiedMediaToContentItem(item: UnifiedMediaItem): ContentItem {
  return {
    id: item.id,
    title: item.title,
    kind: item.kind === 'channel' ? 'live' : item.kind,
    posterUrl: item.posterUrl ?? item.backdropUrl ?? '',
    backdropUrl: item.backdropUrl ?? item.posterUrl ?? '',
    year: 'releaseYear' in item && item.releaseYear ? String(item.releaseYear) : item.kind === 'channel' ? 'Live' : undefined,
    maturityRating: undefined,
    durationLabel: 'durationSeconds' in item ? durationLabel(item.durationSeconds) : item.kind === 'channel' ? 'On now' : undefined,
    genres: [],
    overview: `${item.title} from ${item.providerKind}.`,
    playerRouteContext: {
      providerKind: item.providerKind,
      playlistId: item.playlistId,
      streamId: item.provider.externalId,
      categoryId: item.categoryId,
      mediaKind: item.kind === 'channel' ? 'live' : item.kind,
    },
  };
}
