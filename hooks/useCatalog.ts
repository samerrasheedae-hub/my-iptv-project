import { useRepositories } from '@/providers/RepositoryProvider';
import { useUnifiedMediaRuntime } from '@/providers/UnifiedMediaRuntimeProvider';
import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { ContentItem, ContentRowModel, HomeCatalogModel } from '@/types/content';
import { Channel } from '@/types/channel';
import { Episode } from '@/types/episode';
import { MediaKind, MediaSummary } from '@/types/media';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';
import { unifiedMediaToContentItem } from '@/utils/unifiedContentMapper';
import { useAsyncResource } from './useAsyncResource';

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

const toSummary = (item: Channel | Movie | Series | Episode): MediaSummary => {
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

const summaryToContentItem = async (
  summary: MediaSummary,
  repositories: ReturnType<typeof useRepositories>['repositories'],
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

const findContentItem = async (id: string, repositories: ReturnType<typeof useRepositories>['repositories']) => {
  const detail =
    (await repositories.mediaCatalogRepository.getChannel(id)) ??
    (await repositories.mediaCatalogRepository.getMovie(id)) ??
    (await repositories.mediaCatalogRepository.getSeries(id)) ??
    (await repositories.mediaCatalogRepository.getEpisode(id));

  return detail ? summaryToContentItem(toSummary(detail), repositories) : undefined;
};

export const useHomeCatalog = () => {
  const { repositories, version } = useRepositories();
  return useAsyncResource<HomeCatalogModel>(async () => {
    const home = await repositories.mediaCatalogRepository.getHomeCatalog();
    const mediaPage = await repositories.mediaCatalogRepository.listMedia({ limit: 500 });
    const mediaById = new Map(mediaPage.items.map((item) => [item.id, item]));
    const heroSummary = home.hero ?? mediaPage.items[0];
    const rows: ContentRowModel[] = await Promise.all(home.rows.map(async (row) => ({
      id: row.id,
      title: row.title,
      variant: row.display === 'landscape' ? 'landscape' : row.display === 'continue_watching' ? 'continueWatching' : 'poster',
      items: await Promise.all(row.itemIds.map((id) => mediaById.get(id)).filter(Boolean).map((summary) => summaryToContentItem(summary as MediaSummary, repositories))),
    })));

    const continueWatching = await repositories.userLibraryRepository.listContinueWatching({ limit: 20 });
    if (continueWatching.items.length) {
      const items = (await Promise.all(continueWatching.items.map((item) => findContentItem(item.mediaId, repositories)))).filter(Boolean) as ContentItem[];
      rows.unshift({ id: 'continue-watching', title: 'Continue Watching', variant: 'continueWatching', items });
    }

    return { hero: await summaryToContentItem(heroSummary, repositories), rows };
  }, [repositories, version]);
};

export const useMyList = () => {
  const { repositories, version } = useRepositories();
  return useAsyncResource(async () => {
    const favorites = await repositories.userLibraryRepository.listFavorites({ limit: 500 });
    return (await Promise.all(favorites.items.map((favorite) => findContentItem(favorite.mediaId, repositories)))).filter(Boolean) as ContentItem[];
  }, [repositories, version]);
};

export const useDownloads = () => {
  const { repositories, version } = useRepositories();
  return useAsyncResource(async () => {
    const activePlaylist = await repositories.playlistRepository.getActivePlaylist();
    const downloads = await repositories.cacheRepository.list<{ mediaId: string }>('downloads', { limit: 500 }, { playlistId: activePlaylist?.id });
    return (await Promise.all(downloads.items.map((record) => findContentItem(record.value.mediaId, repositories)))).filter(Boolean) as ContentItem[];
  }, [repositories, version]);
};

export const useContentItem = (id: string) => {
  const { repositories, version } = useRepositories();
  return useAsyncResource(() => findContentItem(id, repositories), [id, repositories, version]);
};

export const useSearch = (query: string) => {
  const { repositories, version } = useRepositories();
  const { container: unifiedContainer } = useUnifiedMediaRuntime();
  const { session } = useXtreamRuntime();
  const connectedPlaylistId = session?.playlistId;

  return useAsyncResource(async () => {
    if (connectedPlaylistId) {
      const results = await unifiedContainer.repository.search({ query, playlistId: connectedPlaylistId, limit: 80 });
      return results.items.map(unifiedMediaToContentItem);
    }

    const results = await repositories.mediaCatalogRepository.search({ text: query, limit: 80 });
    return Promise.all(results.results.map((result) => summaryToContentItem(result.summary, repositories)));
  }, [query, repositories, version, unifiedContainer, connectedPlaylistId]);
};

export const useStreamingActions = () => {
  const { repositories, notifyChanged } = useRepositories();

  return {
    toggleMyList: async (id: string) => {
      const item = await findContentItem(id, repositories);
      if (!item) return;
      if (await repositories.userLibraryRepository.isFavorite(id)) await repositories.userLibraryRepository.removeFavorite(id);
      else await repositories.userLibraryRepository.addFavorite({ playlistId: 'mock-xtream-premium', mediaId: id, mediaKind: item.kind === 'live' ? 'channel' : item.kind === 'collection' ? 'movie' : item.kind, title: item.title, posterUrl: item.posterUrl });
    },
    toggleDownload: async (id: string) => {
      const item = await findContentItem(id, repositories);
      const playlistId = item ? 'mock-xtream-premium' : undefined;
      const existing = await repositories.cacheRepository.get('downloads', id, { playlistId });
      if (existing) await repositories.cacheRepository.remove('downloads', id, { playlistId });
      else await repositories.cacheRepository.set('downloads', id, { mediaId: id, downloadedAt: new Date().toISOString() }, { ttlMs: 1000 * 60 * 60 * 24 * 365, staleWhileRevalidateMs: 1000 * 60 * 60 * 24 * 30 }, { playlistId });
      notifyChanged();
    },
    setProgress: async (id: string, progress: number) => {
      const item = await findContentItem(id, repositories);
      if (!item || item.kind === 'live') return;
      const durationSeconds = 3600;
      await repositories.userLibraryRepository.savePlaybackProgress({
        playlistId: 'mock-xtream-premium',
        mediaId: id,
        mediaKind: item.kind === 'collection' ? 'movie' : item.kind,
        title: item.title,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        positionSeconds: Math.round(durationSeconds * progress),
        durationSeconds,
      });
    },
  };
};
