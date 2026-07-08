import { Channel } from '@/types/channel';
import { Episode } from '@/types/episode';
import { MediaKind, MediaSummary } from '@/types/media';
import { Movie } from '@/types/movie';
import { SearchQuery, SearchResultsPage } from '@/types/search';
import { Series } from '@/types/series';
import { Category } from '@/types/category';
import { toMediaSummary } from '@/repositories/mock/mockDomainData';
import { CacheRepository } from '../CacheRepository';
import { Page, PageRequest } from '../common';
import { HomeCatalog, MediaCatalogRepository, MediaListQuery } from '../MediaCatalogRepository';
import { M3URepository } from '../M3URepository';
import { PlaylistRepository } from '../PlaylistRepository';
import { XtreamRepository } from '../XtreamRepository';

const CATALOG_CACHE_POLICY = {
  ttlMs: 1000 * 60 * 5,
  staleWhileRevalidateMs: 1000 * 60 * 30,
};

const DETAIL_CACHE_POLICY = {
  ttlMs: 1000 * 60 * 15,
  staleWhileRevalidateMs: 1000 * 60 * 60,
};

const emptyPage = <T>(): Page<T> => ({ items: [], totalEstimate: 0 });

export class ProductionMediaCatalogRepository implements MediaCatalogRepository {
  constructor(
    private readonly playlistRepository: PlaylistRepository,
    private readonly xtreamRepository: XtreamRepository,
    private readonly m3uRepository: M3URepository,
    private readonly cacheRepository: CacheRepository,
  ) {}

  async getHomeCatalog(playlistId?: string): Promise<HomeCatalog> {
    const activePlaylistId = playlistId ?? (await this.playlistRepository.getActivePlaylist())?.id;
    if (!activePlaylistId) {
      return { rows: [], generatedAt: new Date().toISOString() };
    }

    const result = await this.cacheRepository.getOrRefresh<HomeCatalog>({
      namespace: 'home-catalog',
      key: 'vertical-netflix-home',
      playlistId: activePlaylistId,
      policy: CATALOG_CACHE_POLICY,
      loader: async () => {
        const summaries = await this.listMedia({ playlistId: activePlaylistId, limit: 200 });
        const live = summaries.items.filter((item) => item.kind === 'channel');
        const movies = summaries.items.filter((item) => item.kind === 'movie');
        const series = summaries.items.filter((item) => item.kind === 'series');
        const rows: HomeCatalog['rows'] = [
          live.length > 0 && { id: 'live-now', title: 'Live Now', kind: 'channel' as MediaKind, display: 'landscape' as const, itemIds: live.map((i) => i.id) },
          movies.length > 0 && { id: 'trending-movies', title: 'Trending Movies', kind: 'movie' as MediaKind, display: 'poster' as const, itemIds: movies.map((i) => i.id) },
          series.length > 0 && { id: 'premium-series', title: 'Premium Series', kind: 'series' as MediaKind, display: 'poster' as const, itemIds: series.map((i) => i.id) },
        ].filter(Boolean) as HomeCatalog['rows'];
        return {
          hero: summaries.items[0],
          rows,
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
        const playlist = await this.playlistRepository.getPlaylist(playlistId);
        if (!playlist) return emptyPage<Category>();
        if (playlist.providerType === 'm3u') {
          return this.m3uRepository.listGroups(playlistId, page);
        }
        if (kind === 'channel') return this.xtreamRepository.listLiveCategories(playlistId, page);
        if (kind === 'movie') return this.xtreamRepository.listVodCategories(playlistId, page);
        if (kind === 'series') return this.xtreamRepository.listSeriesCategories(playlistId, page);
        const [live, vod, series] = await Promise.all([
          this.xtreamRepository.listLiveCategories(playlistId),
          this.xtreamRepository.listVodCategories(playlistId),
          this.xtreamRepository.listSeriesCategories(playlistId),
        ]);
        return {
          items: [...live.items, ...vod.items, ...series.items],
          totalEstimate: (live.totalEstimate ?? 0) + (vod.totalEstimate ?? 0) + (series.totalEstimate ?? 0),
        };
      },
    });
    return result.value as Page<Category>;
  }

  async listMedia(query: MediaListQuery): Promise<Page<MediaSummary>> {
    const activePlaylistId = query.playlistId ?? (await this.playlistRepository.getActivePlaylist())?.id;
    if (!activePlaylistId) return emptyPage<MediaSummary>();
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
    if (!playlistId) return { query, results: [], totalEstimate: 0 };
    const result = await this.cacheRepository.getOrRefresh<SearchResultsPage>({
      namespace: 'search',
      key: JSON.stringify({ ...query, playlistIds: query.playlistIds ?? [playlistId] }),
      playlistId,
      policy: { ttlMs: 1000 * 60 * 2, staleWhileRevalidateMs: 1000 * 60 * 10 },
      loader: async () => {
        const normalized = query.text.trim().toLowerCase();
        const all = await this.listMedia({ playlistId, limit: 10000 });
        const filtered = all.items
          .filter((item) =>
            (!query.kinds?.length || query.kinds.includes(item.kind)) &&
            (!normalized || item.searchText.includes(normalized) || item.title.toLowerCase().includes(normalized)),
          )
          .map((item) => ({ id: item.id, resultKind: item.kind, score: this.score(item, normalized), matchedText: normalized, summary: item }))
          .sort((a, b) => b.score - a.score);
        const paged = filtered.slice(0, query.limit ?? 40);
        return { query, results: paged, totalEstimate: filtered.length };
      },
    });
    return result.value as SearchResultsPage;
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    return this.getDetail<Channel>('channel-detail', id, async () => {
      const playlist = await this.playlistRepository.getActivePlaylist();
      if (!playlist) return undefined;
      const page = await this.xtreamRepository.listChannels(playlist.id, undefined, { limit: 10000 });
      return page.items.find((c) => c.id === id);
    });
  }

  async getMovie(id: string): Promise<Movie | undefined> {
    return this.getDetail<Movie>('movie-detail', id, async () => {
      const playlist = await this.playlistRepository.getActivePlaylist();
      if (!playlist) return undefined;
      const page = await this.xtreamRepository.listMovies(playlist.id, undefined, { limit: 10000 });
      return page.items.find((m) => m.id === id);
    });
  }

  async getSeries(id: string): Promise<Series | undefined> {
    return this.getDetail<Series>('series-detail', id, async () => {
      const playlist = await this.playlistRepository.getActivePlaylist();
      if (!playlist) return undefined;
      const page = await this.xtreamRepository.listSeries(playlist.id, undefined, { limit: 10000 });
      return page.items.find((s) => s.id === id);
    });
  }

  async listEpisodes(seriesId: string, seasonNumber?: number, page?: PageRequest): Promise<Page<Episode>> {
    const playlist = await this.playlistRepository.getActivePlaylist();
    if (!playlist) return emptyPage<Episode>();
    const result = await this.cacheRepository.getOrRefresh<Page<Episode>>({
      namespace: 'episodes',
      key: JSON.stringify({ seriesId, seasonNumber, page }),
      playlistId: playlist.id,
      policy: DETAIL_CACHE_POLICY,
      loader: () => this.xtreamRepository.listEpisodes(playlist.id, seriesId, seasonNumber, page),
    });
    return result.value as Page<Episode>;
  }

  async getEpisode(_id: string): Promise<Episode | undefined> {
    return undefined;
  }

  private async loadMedia(query: MediaListQuery): Promise<Page<MediaSummary>> {
    const active = query.playlistId;
    if (!active) return emptyPage<MediaSummary>();
    const playlist = await this.playlistRepository.getPlaylist(active);
    if (!playlist) return emptyPage<MediaSummary>();

    let items: MediaSummary[] = [];

    if (playlist.providerType === 'm3u') {
      const channels = await this.m3uRepository.listChannels(active, query.categoryId, { limit: 10000 });
      items = channels.items.map((ch) => toMediaSummary(ch));
    } else {
      const [channels, movies, series] = await Promise.all([
        this.xtreamRepository.listChannels(active, query.categoryId, { limit: 10000 }),
        this.xtreamRepository.listMovies(active, query.categoryId, { limit: 10000 }),
        this.xtreamRepository.listSeries(active, query.categoryId, { limit: 10000 }),
      ]);
      items = [
        ...channels.items.map((ch) => toMediaSummary(ch)),
        ...movies.items.map((m) => toMediaSummary(m)),
        ...series.items.map((s) => toMediaSummary(s)),
      ];
    }

    if (query.kind) items = items.filter((item) => item.kind === query.kind);
    const limit = query.limit ?? items.length;
    return { items: items.slice(0, limit), totalEstimate: items.length };
  }

  private async getDetail<T>(namespace: string, id: string, loader: () => Promise<T | undefined>): Promise<T | undefined> {
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

  private score(item: MediaSummary, query: string): number {
    if (!query) return 1;
    if (item.title.toLowerCase() === query) return 100;
    if (item.title.toLowerCase().startsWith(query)) return 75;
    if (item.searchText.includes(query)) return 50;
    return 10;
  }
}
