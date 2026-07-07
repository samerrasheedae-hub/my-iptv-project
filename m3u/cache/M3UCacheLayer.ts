import { CachePolicy, CacheRepository } from '@/repositories/CacheRepository';
import { M3UCategory, M3UPage, M3USourceDescriptor, M3USourceStatus, M3UStreamMetadata } from '@/m3u/types';

const SOURCE_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 60 * 24 * 30, staleWhileRevalidateMs: 1000 * 60 * 60 * 24 * 7 };
const SOURCE_STATUS_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 10, staleWhileRevalidateMs: 1000 * 60 * 60 };
const CATEGORY_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 60, staleWhileRevalidateMs: 1000 * 60 * 60 * 24 };
const STREAM_CATEGORY_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 20, staleWhileRevalidateMs: 1000 * 60 * 60 * 8 };

export interface M3UCacheLayer {
  getOrRefreshSource(playlistId: string, loader: () => Promise<M3USourceDescriptor>): Promise<M3USourceDescriptor>;
  getOrRefreshSourceStatus(playlistId: string, loader: () => Promise<M3USourceStatus>): Promise<M3USourceStatus>;
  getOrRefreshCategories(playlistId: string, cursor: string | undefined, limit: number, loader: () => Promise<M3UPage<M3UCategory>>): Promise<M3UPage<M3UCategory>>;
  getOrRefreshStreams(playlistId: string, categoryId: string, cursor: string | undefined, limit: number, forceRefresh: boolean | undefined, loader: () => Promise<M3UPage<M3UStreamMetadata>>): Promise<M3UPage<M3UStreamMetadata>>;
  markCategoryCached(playlistId: string, categoryId: string): Promise<void>;
  getCachedCategoryIds(playlistId: string): Promise<string[]>;
  invalidatePlaylist(playlistId: string): Promise<void>;
}

export class RepositoryM3UCacheLayer implements M3UCacheLayer {
  constructor(private readonly cacheRepository: CacheRepository) {}

  async getOrRefreshSource(playlistId: string, loader: () => Promise<M3USourceDescriptor>): Promise<M3USourceDescriptor> {
    const result = await this.cacheRepository.getOrRefresh({ namespace: 'm3u-source', key: 'descriptor', playlistId, policy: SOURCE_POLICY, loader });
    return result.value as M3USourceDescriptor;
  }

  async getOrRefreshSourceStatus(playlistId: string, loader: () => Promise<M3USourceStatus>): Promise<M3USourceStatus> {
    const result = await this.cacheRepository.getOrRefresh({ namespace: 'm3u-source-status', key: 'status', playlistId, policy: SOURCE_STATUS_POLICY, loader });
    return result.value as M3USourceStatus;
  }

  async getOrRefreshCategories(playlistId: string, cursor: string | undefined, limit: number, loader: () => Promise<M3UPage<M3UCategory>>): Promise<M3UPage<M3UCategory>> {
    const result = await this.cacheRepository.getOrRefresh({
      namespace: 'm3u-categories',
      key: JSON.stringify({ cursor: cursor ?? null, limit }),
      playlistId,
      policy: CATEGORY_POLICY,
      loader,
    });
    return result.value as M3UPage<M3UCategory>;
  }

  async getOrRefreshStreams(playlistId: string, categoryId: string, cursor: string | undefined, limit: number, forceRefresh: boolean | undefined, loader: () => Promise<M3UPage<M3UStreamMetadata>>): Promise<M3UPage<M3UStreamMetadata>> {
    const result = await this.cacheRepository.getOrRefresh({
      namespace: 'm3u-category-streams',
      key: JSON.stringify({ categoryId, cursor: cursor ?? null, limit }),
      playlistId,
      forceRefresh,
      policy: STREAM_CATEGORY_POLICY,
      loader,
    });
    await this.markCategoryCached(playlistId, categoryId);
    return result.value as M3UPage<M3UStreamMetadata>;
  }

  async markCategoryCached(playlistId: string, categoryId: string): Promise<void> {
    const ids = await this.getCachedCategoryIds(playlistId);
    if (ids.includes(categoryId)) return;
    await this.cacheRepository.set('m3u-cached-category-index', 'ids', [...ids, categoryId], CATEGORY_POLICY, { playlistId });
  }

  async getCachedCategoryIds(playlistId: string): Promise<string[]> {
    return (await this.cacheRepository.get<string[]>('m3u-cached-category-index', 'ids', { playlistId })) ?? [];
  }

  async invalidatePlaylist(playlistId: string): Promise<void> {
    await this.cacheRepository.invalidatePlaylist(playlistId);
  }
}
