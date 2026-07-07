import { RepositoryContainer } from '@/repositories/RepositoryContainer';
import { Channel } from '@/types/channel';
import { ContentItem } from '@/types/content';
import { Episode } from '@/types/episode';
import { MediaKind, MediaSummary } from '@/types/media';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';

const imageByRole = (summary: MediaSummary, role: 'poster' | 'backdrop') =>
  summary.images.find((image) => image.role === role)?.url ?? summary.images[0]?.url ?? '';

const durationLabel = (seconds?: number) => {
  if (!seconds) return undefined;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const contentKind = (kind: MediaKind): ContentItem['kind'] => {
  if (kind === 'channel') return 'live';
  if (kind === 'series' || kind === 'episode') return 'series';
  return 'movie';
};

export const detailToMediaSummary = (item: Channel | Movie | Series | Episode): MediaSummary => {
  const kind: MediaKind = 'isLive' in item ? 'channel' : 'seriesId' in item ? 'episode' : 'stream' in item ? 'movie' : 'series';
  return {
    id: item.id,
    kind,
    title: item.title,
    subtitle: kind === 'channel' ? 'Live' : kind === 'episode' ? `S${(item as Episode).seasonNumber}:E${(item as Episode).episodeNumber}` : 'releaseYear' in item && item.releaseYear ? String(item.releaseYear) : undefined,
    description: 'overview' in item ? item.overview : undefined,
    categoryIds: 'categoryIds' in item ? item.categoryIds : [],
    images: item.images,
    provider: item.provider,
    releaseYear: 'releaseYear' in item ? item.releaseYear : undefined,
    maturityRating: 'maturityRating' in item ? item.maturityRating : undefined,
    durationSeconds: 'durationSeconds' in item ? item.durationSeconds : undefined,
    genres: 'genres' in item ? item.genres : undefined,
    rating: 'rating' in item ? item.rating : undefined,
    sortTitle: item.sortTitle,
    searchText: item.searchText,
    updatedAt: item.updatedAt,
  };
};

export const mediaSummaryToContentItem = async (
  summary: MediaSummary,
  repositories: RepositoryContainer,
): Promise<ContentItem> => {
  const [favorite, progress, download] = await Promise.all([
    repositories.userLibraryRepository.isFavorite(summary.id),
    repositories.userLibraryRepository.getContinueWatching(summary.id),
    repositories.cacheRepository.get<{ mediaId: string }>('downloads', summary.id, { playlistId: summary.provider.playlistId }),
  ]);

  return {
    id: summary.id,
    title: summary.title,
    kind: contentKind(summary.kind),
    posterUrl: imageByRole(summary, 'poster'),
    backdropUrl: imageByRole(summary, 'backdrop'),
    year: summary.releaseYear ? String(summary.releaseYear) : summary.subtitle,
    maturityRating: summary.maturityRating,
    durationLabel: durationLabel(summary.durationSeconds) ?? summary.subtitle,
    progress: progress?.progress,
    isInMyList: favorite,
    isDownloaded: Boolean(download),
    genres: summary.genres ?? [],
    overview: summary.description ?? '',
  };
};

export const findContentItem = async (id: string, repositories: RepositoryContainer) => {
  const detail =
    (await repositories.mediaCatalogRepository.getChannel(id)) ??
    (await repositories.mediaCatalogRepository.getMovie(id)) ??
    (await repositories.mediaCatalogRepository.getSeries(id)) ??
    (await repositories.mediaCatalogRepository.getEpisode(id));

  return detail ? mediaSummaryToContentItem(detailToMediaSummary(detail), repositories) : undefined;
};
