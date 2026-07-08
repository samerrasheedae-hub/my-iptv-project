import { AppLogger } from '@/stability/AppLogger';
import { MemoryCacheStore, PersistentCacheStore, ProductionCacheRepository } from '@/cache';
import { RepositoryContainer } from '../RepositoryContainer';
import { ProductionPlaylistRepository } from './ProductionPlaylistRepository';
import { ProductionUserLibraryRepository } from './ProductionUserLibraryRepository';
import { ProductionUserSettingsRepository } from './ProductionUserSettingsRepository';
import { ProductionMediaCatalogRepository } from './ProductionMediaCatalogRepository';
import { MockXtreamRepository } from '../mock/MockXtreamRepository';
import { MockM3URepository } from '../mock/MockM3URepository';

export function createProductionRepositoryContainer(onChange?: () => void): RepositoryContainer {
  const cacheRepository = new ProductionCacheRepository({
    memoryStore: new MemoryCacheStore(),
    persistentStore: new PersistentCacheStore(),
    onBackgroundError: (error, identity) =>
      AppLogger.warn('cache_background_refresh_failed', { identity, error: String(error) }),
  });

  const playlistRepository = new ProductionPlaylistRepository();
  const userLibraryRepository = new ProductionUserLibraryRepository(onChange);
  const userSettingsRepository = new ProductionUserSettingsRepository();

  const xtreamRepository = new MockXtreamRepository();
  const m3uRepository = new MockM3URepository();

  const mediaCatalogRepository = new ProductionMediaCatalogRepository(
    playlistRepository,
    xtreamRepository,
    m3uRepository,
    cacheRepository,
  );

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
