import { CachePolicy, CacheRepository } from '@/repositories/CacheRepository';
import { UnifiedCategory, UnifiedHomeFeed, UnifiedMediaItem, UnifiedPage } from '@/media/types';

const CATEGORY_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 30, staleWhileRevalidateMs: 1000 * 60 * 60 * 6 };
const MEDIA_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 15, staleWhileRevalidateMs: 1000 * 60 * 60 * 4 };
const SEARCH_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 5, staleWhileRevalidateMs: 1000 * 60 * 20 };
const HOME_POLICY: CachePolicy = { ttlMs: 1000 * 60 * 10, staleWhileRevalidateMs: 1000 * 60 * 60 };

export interface UnifiedMediaCache {
  getOrRefreshCategories(key: string, playlistId: string | undefined, loader: () => Promise<UnifiedPage<UnifiedCategory>>): Promise<UnifiedPage<UnifiedCategory>>;
  getOrRefreshMedia(key: string, playlistId: string | undefined, loader: () => Promise<UnifiedPage<UnifiedMediaItem>>): Promise<UnifiedPage<UnifiedMediaItem>>;
  getOrRefreshSearch(key: string, playlistId: string | undefined, loader: () => Promise<UnifiedPage<UnifiedMediaItem>>): Promise<UnifiedPage<UnifiedMediaItem>>;
  getOrRefreshHome(key: string, playlistId: string | undefined, loader: () => Promise<UnifiedHomeFeed>): Promise<UnifiedHomeFeed>;
}

export class RepositoryUnifiedMediaCache implements UnifiedMediaCache {
  constructor(private readonly cacheRepository: CacheRepository) {}

  async getOrRefreshCategories(key: string, playlistId: string | undefined, loader: () => Promise<UnifiedPage<UnifiedCategory>>) {
    const result = await this.cacheRepository.getOrRefresh({ namespace: 'unified-categories', key, playlistId, policy: CATEGORY_POLICY, loader });
    return result.value as UnifiedPage<UnifiedCategory>;
  }

  async getOrRefreshMedia(key: string, playlistId: string | undefined, loader: () => Promise<UnifiedPage<UnifiedMediaItem>>) {
    const result = await this.cacheRepository.getOrRefresh({ namespace: 'unified-media', key, playlistId, policy: MEDIA_POLICY, loader });
    return result.value as UnifiedPage<UnifiedMediaItem>;
  }

  async getOrRefreshSearch(key: string, playlistId: string | undefined, loader: () => Promise<UnifiedPage<UnifiedMediaItem>>) {
    const result = await this.cacheRepository.getOrRefresh({ namespace: 'unified-search', key, playlistId, policy: SEARCH_POLICY, loader });
    return result.value as UnifiedPage<UnifiedMediaItem>;
  }

  async getOrRefreshHome(key: string, playlistId: string | undefined, loader: () => Promise<UnifiedHomeFeed>) {
    const result = await this.cacheRepository.getOrRefresh({ namespace: 'unified-home', key, playlistId, policy: HOME_POLICY, loader });
    return result.value as UnifiedHomeFeed;
  }
}
