import { useUnifiedMediaRuntime } from '@/providers/UnifiedMediaRuntimeProvider';
import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { useRepositories } from '@/providers/RepositoryProvider';
import { UnifiedCategoryMediaRequest } from '@/media/types';
import { MediaListQuery } from '@/repositories/MediaCatalogRepository';
import { ContentItem, ContentRowModel } from '@/types/content';
import { mediaSummaryToContentItem, findContentItem } from '@/utils/contentMapper';
import { unifiedMediaToContentItem } from '@/utils/unifiedContentMapper';
import { useAsyncResource } from './useAsyncResource';

export interface NetflixHomeRowModel extends ContentRowModel {
  nextCursor?: string;
  query?: MediaListQuery;
  unifiedQuery?: UnifiedCategoryMediaRequest;
}

export interface NetflixHomeModel {
  hero: ContentItem;
  rows: NetflixHomeRowModel[];
}

const PAGE_SIZE = 2;

export function useNetflixHome() {
  const { repositories, version } = useRepositories();
  const { container: unifiedContainer } = useUnifiedMediaRuntime();
  const { session } = useXtreamRuntime();
  const connectedPlaylistId = session?.playlistId;

  const resource = useAsyncResource<NetflixHomeModel>(async () => {
    if (connectedPlaylistId) {
      const feed = await unifiedContainer.repository.getHomeFeed({ xtream: connectedPlaylistId });
      const rows: NetflixHomeRowModel[] = feed.rows.map((row) => ({
        id: row.id,
        title: row.title,
        variant: row.kind === 'channel' ? 'landscape' : 'poster',
        items: row.items.map(unifiedMediaToContentItem),
        nextCursor: row.nextCursor,
        unifiedQuery: row.providerKind && row.playlistId && row.categoryId ? {
          providerKind: row.providerKind,
          playlistId: row.playlistId,
          categoryId: row.categoryId,
          kind: row.kind === 'mixed' ? undefined : row.kind,
          limit: PAGE_SIZE,
        } : undefined,
      }));

      const continueWatching = await repositories.userLibraryRepository.listContinueWatching({ limit: PAGE_SIZE });
      const continueItems = (await Promise.all(
        continueWatching.items.map((item) => findContentItem(item.mediaId, repositories)),
      )).filter(Boolean) as ContentItem[];
      if (continueItems.length) rows.unshift({ id: 'continue-watching', title: 'Continue Watching', variant: 'continueWatching', items: continueItems, nextCursor: continueWatching.nextCursor });

      const hero = feed.hero ? unifiedMediaToContentItem(feed.hero) : rows.flatMap((row) => row.items)[0];
      if (hero) return { hero, rows };
    }

    const activePlaylist = await repositories.playlistRepository.getActivePlaylist();
    const playlistId = activePlaylist?.id;

    const home = await repositories.mediaCatalogRepository.getHomeCatalog(playlistId);
    const heroSummary = home.hero ?? (await repositories.mediaCatalogRepository.listMedia({ playlistId, limit: 1 })).items[0];

    if (!heroSummary) return null;

    const rowConfigs: Array<Omit<NetflixHomeRowModel, 'items' | 'nextCursor'> & { query?: MediaListQuery }> = [
      { id: 'recently-added', title: 'Recently Added', variant: 'poster', query: { playlistId, limit: PAGE_SIZE, sort: 'recently_added' } },
      { id: 'trending', title: 'Trending Now', variant: 'poster', query: { playlistId, limit: PAGE_SIZE, sort: 'rating' } },
      { id: 'live-tv', title: 'Live TV', variant: 'landscape', query: { playlistId, limit: PAGE_SIZE, kind: 'channel' } },
      { id: 'movies', title: 'Movies', variant: 'poster', query: { playlistId, limit: PAGE_SIZE, kind: 'movie', sort: 'release_year' } },
      { id: 'series', title: 'Series', variant: 'poster', query: { playlistId, limit: PAGE_SIZE, kind: 'series', sort: 'title' } },
    ];

    const continueWatching = await repositories.userLibraryRepository.listContinueWatching({ limit: PAGE_SIZE });
    const continueItems = (await Promise.all(
      continueWatching.items.map((item) => findContentItem(item.mediaId, repositories)),
    )).filter(Boolean) as ContentItem[];

    const rows = await Promise.all(rowConfigs.map(async (row) => {
      const page = await repositories.mediaCatalogRepository.listMedia(row.query as MediaListQuery);
      return {
        ...row,
        items: await Promise.all(page.items.map((summary) => mediaSummaryToContentItem(summary, repositories))),
        nextCursor: page.nextCursor,
      };
    }));

    if (continueItems.length) {
      rows.unshift({ id: 'continue-watching', title: 'Continue Watching', variant: 'continueWatching', items: continueItems, nextCursor: continueWatching.nextCursor });
    }

    return {
      hero: await mediaSummaryToContentItem(heroSummary, repositories),
      rows,
    };
  }, [repositories, version, unifiedContainer, connectedPlaylistId]);

  const loadMoreRow = async (row: NetflixHomeRowModel, cursor?: string) => {
    if (row.unifiedQuery && cursor) {
      const page = await unifiedContainer.repository.listMediaByCategory({ ...row.unifiedQuery, cursor, limit: PAGE_SIZE });
      return { items: page.items.map(unifiedMediaToContentItem), nextCursor: page.nextCursor };
    }

    if (!row.query || !cursor) return { items: [], nextCursor: undefined };
    const page = await repositories.mediaCatalogRepository.listMedia({ ...row.query, cursor, limit: PAGE_SIZE });
    return {
      items: await Promise.all(page.items.map((summary) => mediaSummaryToContentItem(summary, repositories))),
      nextCursor: page.nextCursor,
    };
  };

  return { ...resource, loadMoreRow };
}
