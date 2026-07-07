import { CachePolicy, CacheRepository } from '@/repositories/CacheRepository';
import {
  XtreamAccountInfo,
  XtreamCategory,
  XtreamContentKind,
  XtreamPage,
  XtreamSession,
  XtreamStreamSummary,
} from '@/xtream/types';

const ACCOUNT_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 15, staleWhileRevalidateMs: 1000 * 60 * 60 * 6 };
const CATEGORY_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 60, staleWhileRevalidateMs: 1000 * 60 * 60 * 24 };
const STREAM_CATEGORY_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 20, staleWhileRevalidateMs: 1000 * 60 * 60 * 8 };
const SESSION_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 60 * 12, staleWhileRevalidateMs: 1000 * 60 * 30 };

export interface XtreamCacheLayer {
  getOrRefreshSession(playlistId: string, loader: () => Promise<XtreamSession>): Promise<XtreamSession>;
  getOrRefreshAccount(playlistId: string, loader: () => Promise<XtreamAccountInfo>): Promise<XtreamAccountInfo>;
  getOrRefreshCategories(playlistId: string, kind: XtreamContentKind, cursor: string | undefined, limit: number, loader: () => Promise<XtreamPage<XtreamCategory>>): Promise<XtreamPage<XtreamCategory>>;
  getOrRefreshStreams(playlistId: string, categoryId: string, kind: XtreamContentKind, cursor: string | undefined, limit: number, forceRefresh: boolean | undefined, loader: () => Promise<XtreamPage<XtreamStreamSummary>>): Promise<XtreamPage<XtreamStreamSummary>>;
  markCategoryCached(playlistId: string, categoryId: string, kind: XtreamContentKind): Promise<void>;
  getCachedCategoryRefs(playlistId: string): Promise<Array<{ categoryId: string; kind: XtreamContentKind }>>;
  invalidatePlaylist(playlistId: string): Promise<void>;
}

export class RepositoryXtreamCacheLayer implements XtreamCacheLayer {
  constructor(private readonly cacheRepository: CacheRepository) {}

  async getOrRefreshSession(playlistId: string, loader: () => Promise<XtreamSession>): Promise<XtreamSession> {
    const result = await this.cacheRepository.getOrRefresh({
      namespace: 'xtream-session',
      key: 'current',
      playlistId,
      policy: SESSION_POLICY,
      loader,
    });
    return result.value as XtreamSession;
  }

  async getOrRefreshAccount(playlistId: string, loader: () => Promise<XtreamAccountInfo>): Promise<XtreamAccountInfo> {
    const result = await this.cacheRepository.getOrRefresh({
      namespace: 'xtream-account',
      key: 'info',
      playlistId,
      policy: ACCOUNT_POLICY,
      loader,
    });
    return result.value as XtreamAccountInfo;
  }

  async getOrRefreshCategories(
    playlistId: string,
    kind: XtreamContentKind,
    cursor: string | undefined,
    limit: number,
    loader: () => Promise<XtreamPage<XtreamCategory>>,
  ): Promise<XtreamPage<XtreamCategory>> {
    const result = await this.cacheRepository.getOrRefresh({
      namespace: 'xtream-categories',
      key: JSON.stringify({ kind, cursor: cursor ?? null, limit }),
      playlistId,
      policy: CATEGORY_POLICY,
      loader,
    });
    return result.value as XtreamPage<XtreamCategory>;
  }

  async getOrRefreshStreams(
    playlistId: string,
    categoryId: string,
    kind: XtreamContentKind,
    cursor: string | undefined,
    limit: number,
    forceRefresh: boolean | undefined,
    loader: () => Promise<XtreamPage<XtreamStreamSummary>>,
  ): Promise<XtreamPage<XtreamStreamSummary>> {
    const result = await this.cacheRepository.getOrRefresh<XtreamStreamSummary[]>({
      namespace: 'xtream-category-streams',
      key: JSON.stringify({ categoryId, kind, scope: 'full-category' }),
      playlistId,
      forceRefresh,
      policy: STREAM_CATEGORY_POLICY,
      loader: async () => (await loader()).items,
    });
    await this.markCategoryCached(playlistId, categoryId, kind);
    return this.page(result.value ?? [], limit, cursor);
  }

  async markCategoryCached(playlistId: string, categoryId: string, kind: XtreamContentKind): Promise<void> {
    const refs = await this.getCachedCategoryRefs(playlistId);
    const exists = refs.some((ref) => ref.categoryId === categoryId && ref.kind === kind);
    if (exists) return;
    await this.cacheRepository.set('xtream-cached-category-index', 'refs', [...refs, { categoryId, kind }], CATEGORY_POLICY, { playlistId });
  }

  async getCachedCategoryRefs(playlistId: string): Promise<Array<{ categoryId: string; kind: XtreamContentKind }>> {
    return (await this.cacheRepository.get<Array<{ categoryId: string; kind: XtreamContentKind }>>('xtream-cached-category-index', 'refs', { playlistId })) ?? [];
  }

  async invalidatePlaylist(playlistId: string): Promise<void> {
    await this.cacheRepository.invalidatePlaylist(playlistId);
  }

  private page<T>(items: T[], limit: number, cursor?: string): XtreamPage<T> {
    const offset = cursor ? Number(cursor) : 0;
    const nextOffset = offset + limit;
    return {
      items: items.slice(offset, nextOffset),
      nextCursor: nextOffset < items.length ? String(nextOffset) : undefined,
      totalEstimate: items.length,
    };
  }
}
