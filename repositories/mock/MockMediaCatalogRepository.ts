import { Category } from '@/types/category';
import { Channel } from '@/types/channel';
import { Episode } from '@/types/episode';
import { MediaKind, MediaSummary } from '@/types/media';
import { Movie } from '@/types/movie';
import { SearchQuery, SearchResultsPage } from '@/types/search';
import { Series } from '@/types/series';
import { CacheRepository } from '../CacheRepository';
import { Page, PageRequest } from '../common';
import { HomeCatalog, MediaCatalogRepository, MediaListQuery } from '../MediaCatalogRepository';
import { M3URepository } from '../M3URepository';
import { PlaylistRepository } from '../PlaylistRepository';
import { XtreamRepository } from '../XtreamRepository';
import { allMediaSummaries, mockCategories, mockChannels, mockEpisodes, mockM3UChannels, mockMovies, mockSeries, toMediaSummary } from './mockDomainData';
import { pageItems, wait } from './paging';

const CATALOG_CACHE_POLICY = {
  ttlMs: 1000 * 60 * 5,
  staleWhileRevalidateMs: 1000 * 60 * 30,
};

const DETAIL_CACHE_POLICY = {
  ttlMs: 1000 * 60 * 15,
  staleWhileRevalidateMs: 1000 * 60 * 60,
};

export class MockMediaCatalogRepository implements MediaCatalogRepository {
  constructor(
    private readonly playlistRepository: PlaylistRepository,
    private readonly xtreamRepository: XtreamRepository,
    private readonly m3uRepository: M3URepository,
    private readonly cacheRepository: CacheRepository,
  ) {}

  async getHomeCatalog(playlistId?: string): Promise<HomeCatalog> {
    const activePlaylistId = playlistId ?? (await this.playlistRepository.getActivePlaylist())?.id;
    const result = await this.cacheRepository.getOrRefresh<HomeCatalog>({
      namespace: 'home-catalog',
      key: 'vertical-netflix-home',
      playlistId: activePlaylistId,
      policy: CATALOG_CACHE_POLICY,
      loader: async () => {
        await wait(140);
        const summaries = await this.listMedia({ playlistId: activePlaylistId, limit: 200 });
        const live = summaries.items.filter((item) => item.kind === 'channel');
        const movies = summaries.items.filter((item) => item.kind === 'movie');
        const series = summaries.items.filter((item) => item.kind === 'series');

        return {
          hero: summaries.items[0],
          rows: [
            { id: 'live-now', title: 'Live Now', kind: 'channel', display: 'landscape', itemIds: live.map((item) => item.id) },
            { id: 'trending-movies', title: 'Trending Movies', kind: 'movie', display: 'poster', itemIds: movies.map((item) => item.id) },
            { id: 'premium-series', title: 'Premium Series', kind: 'series', display: 'poster', itemIds: series.map((item) => item.id) },
            { id: 'all-featured', title: 'Featured For You', kind: 'mixed', display: 'poster', itemIds: summaries.items.map((item) => item.id) },
          ],
          generatedAt: new Date().toISOString(),
        };
      },
    });

    return result.value as HomeCatalog;
  }

  async listCategories(playlistId: string, kind?: MediaKind | 'mixed', page?: PageRequest): Promise<Page<Category>> {
    const result = await this.cacheRepository.getOrRefresh<Page<Category>>({
      namespace: 'categories',
      key: JSON.stringify({ kind: kind ?? 'all', page }),
      playlistId,
      policy: CATALOG_CACHE_POLICY,
      loader: async () => {
        await wait(100);
        if (kind === 'mixed' || !kind) return pageItems(mockCategories.filter((category) => category.playlistId === playlistId), page);
        return pageItems(mockCategories.filter((category) => category.playlistId === playlistId && category.kind === kind), page);
      },
    });
    return result.value as Page<Category>;
  }

  async listMedia(query: MediaListQuery): Promise<Page<MediaSummary>> {
    const activePlaylistId = query.playlistId ?? (await this.playlistRepository.getActivePlaylist())?.id;
    const result = await this.cacheRepository.getOrRefresh<Page<MediaSummary>>({
      namespace: 'media-list',
      key: JSON.stringify({ ...query, playlistId: activePlaylistId }),
      playlistId: activePlaylistId,
      policy: CATALOG_CACHE_POLICY,
      loader: () => this.loadMedia({ ...query, playlistId: activePlaylistId }),
    });
    return result.value as Page<MediaSummary>;
  }

  async search(query: SearchQuery): Promise<SearchResultsPage> {
    const playlistId = query.playlistIds?.[0] ?? (await this.playlistRepository.getActivePlaylist())?.id;
    const result = await this.cacheRepository.getOrRefresh<SearchResultsPage>({
      namespace: 'search',
      key: JSON.stringify({ ...query, playlistIds: query.playlistIds ?? [playlistId] }),
      playlistId,
      policy: { ttlMs: 1000 * 60 * 2, staleWhileRevalidateMs: 1000 * 60 * 10 },
      loader: async () => {
        await wait(100);
        const normalized = query.text.trim().toLowerCase();
        const page = await this.listMedia({ playlistId, limit: 10000 });
        const filtered = page.items
          .filter((item) => (!query.kinds?.length || query.kinds.includes(item.kind)) && (!normalized || item.searchText.includes(normalized) || item.title.toLowerCase().includes(normalized)))
          .map((item) => ({ id: item.id, resultKind: item.kind, score: this.score(item, normalized), matchedText: normalized, summary: item }))
          .sort((a, b) => b.score - a.score);

        const paged = pageItems(filtered, { limit: query.limit ?? 40, cursor: query.cursor });
        return { query, results: paged.items, totalEstimate: paged.totalEstimate, nextCursor: paged.nextCursor };
      },
    });
    return result.value as SearchResultsPage;
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    return this.getDetail('channel-detail', id, async () => {
      await wait(80);
      return [...mockChannels, ...mockM3UChannels].find((item) => item.id === id);
    });
  }

  async getMovie(id: string): Promise<Movie | undefined> {
    return this.getDetail('movie-detail', id, async () => {
      await wait(80);
      return mockMovies.find((item) => item.id === id);
    });
  }

  async getSeries(id: string): Promise<Series | undefined> {
    return this.getDetail('series-detail', id, async () => {
      await wait(80);
      return mockSeries.find((item) => item.id === id);
    });
  }

  async listEpisodes(seriesId: string, seasonNumber?: number, page?: PageRequest): Promise<Page<Episode>> {
    const playlistId = (await this.playlistRepository.getActivePlaylist())?.id;
    const result = await this.cacheRepository.getOrRefresh<Page<Episode>>({
      namespace: 'episodes',
      key: JSON.stringify({ seriesId, seasonNumber, page }),
      playlistId,
      policy: DETAIL_CACHE_POLICY,
      loader: async () => {
        await wait(80);
        return pageItems(mockEpisodes.filter((item) => item.seriesId === seriesId && (!seasonNumber || item.seasonNumber === seasonNumber)), page);
      },
    });
    return result.value as Page<Episode>;
  }

  async getEpisode(id: string): Promise<Episode | undefined> {
    return this.getDetail('episode-detail', id, async () => {
      await wait(80);
      return mockEpisodes.find((item) => item.id === id);
    });
  }

  private async loadMedia(query: MediaListQuery): Promise<Page<MediaSummary>> {
    await wait(120);
    const active = query.playlistId;
    let items: MediaSummary[] = [];

    if (active) {
      const playlist = await this.playlistRepository.getPlaylist(active);
      if (playlist?.providerType === 'm3u') {
        const channels = await this.m3uRepository.listChannels(active, query.categoryId, { limit: 10000 });
        items = channels.items.map(toMediaSummary);
      } else {
        const [channels, movies, series] = await Promise.all([
          this.xtreamRepository.listChannels(active, query.categoryId, { limit: 10000 }),
          this.xtreamRepository.listMovies(active, query.categoryId, { limit: 10000 }),
          this.xtreamRepository.listSeries(active, query.categoryId, { limit: 10000 }),
        ]);
        items = [...channels.items, ...movies.items, ...series.items].map(toMediaSummary);
      }
    } else {
      items = allMediaSummaries();
    }

    if (query.kind) items = items.filter((item) => item.kind === query.kind);
    items = this.sort(items, query.sort);
    return pageItems(items, query);
  }

  private async getDetail<T>(namespace: string, id: string, loader: () => Promise<T | undefined>) {
    const playlistId = (await this.playlistRepository.getActivePlaylist())?.id;
    const result = await this.cacheRepository.getOrRefresh<T | undefined>({
      namespace,
      key: id,
      playlistId,
      policy: DETAIL_CACHE_POLICY,
      loader,
    });
    return result.value;
  }

  private sort(items: MediaSummary[], sort: MediaListQuery['sort']) {
    switch (sort) {
      case 'title':
        return [...items].sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
      case 'release_year':
        return [...items].sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
      case 'recently_added':
        return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      case 'rating':
        return [...items].sort((a, b) => (b.rating?.value ?? 0) - (a.rating?.value ?? 0));
      default:
        return items;
    }
  }

  private score(item: MediaSummary, query: string) {
    if (!query) return 1;
    if (item.title.toLowerCase() === query) return 100;
    if (item.title.toLowerCase().startsWith(query)) return 75;
    if (item.searchText.includes(query)) return 50;
    return 10;
  }
}
