import { AppLogger } from '@/stability/AppLogger';
import { MemoryCacheStore, PersistentCacheStore, ProductionCacheRepository } from '@/cache';
import { mockCatalogItems } from '@/data/mockContent';
import { RepositoryContainer } from '../RepositoryContainer';
import { MockM3URepository } from './MockM3URepository';
import { MockMediaCatalogRepository } from './MockMediaCatalogRepository';
import { MockPlaylistRepository } from './MockPlaylistRepository';
import { MockUserLibraryRepository } from './MockUserLibraryRepository';
import { MockUserSettingsRepository } from './MockUserSettingsRepository';
import { MockXtreamRepository } from './MockXtreamRepository';
import { XTREAM_PLAYLIST_ID } from './mockDomainData';

const DOWNLOAD_CACHE_POLICY = {
  ttlMs: 1000 * 60 * 60 * 24 * 365,
  staleWhileRevalidateMs: 1000 * 60 * 60 * 24 * 30,
};

export function createMockRepositoryContainer(onChange?: () => void): RepositoryContainer {
  const playlistRepository = new MockPlaylistRepository();
  const xtreamRepository = new MockXtreamRepository();
  const m3uRepository = new MockM3URepository();
  const cacheRepository = new ProductionCacheRepository({
    memoryStore: new MemoryCacheStore(),
    persistentStore: new PersistentCacheStore(),
    onBackgroundError: (error, identity) => AppLogger.warn('cache_background_refresh_failed', { identity, error: String(error) }),
  });
  const userLibraryRepository = new MockUserLibraryRepository(onChange);
  const userSettingsRepository = new MockUserSettingsRepository();
  const mediaCatalogRepository = new MockMediaCatalogRepository(playlistRepository, xtreamRepository, m3uRepository, cacheRepository);

  mockCatalogItems.filter((item) => item.isDownloaded).forEach((item) => {
    void cacheRepository.set(
      'downloads',
      item.id,
      { mediaId: item.id, downloadedAt: new Date().toISOString() },
      DOWNLOAD_CACHE_POLICY,
      { playlistId: XTREAM_PLAYLIST_ID },
    );
  });

  return {
    playlistRepository,
    mediaCatalogRepository,
    userLibraryRepository,
    userSettingsRepository,
    xtreamRepository,
    m3uRepository,
    cacheRepository,
  };
}
