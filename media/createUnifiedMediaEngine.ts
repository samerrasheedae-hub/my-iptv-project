import { MemoryCacheStore, PersistentCacheStore, ProductionCacheRepository } from '@/cache';
import { RepositoryUnifiedMediaCache } from '@/media/cache/UnifiedMediaCache';
import { ProductionUnifiedMediaEngine, UnifiedMediaEngine } from '@/media/engine/UnifiedMediaEngine';
import { M3UProvider } from '@/media/providers/M3UProvider';
import { XtreamProvider } from '@/media/providers/XtreamProvider';
import { EngineBackedUnifiedMediaRepository, UnifiedMediaRepository } from '@/media/repositories/UnifiedMediaRepository';
import { M3URepository } from '@/m3u/repositories/M3URepository';
import { XtreamRepository } from '@/xtream/repositories/XtreamRepository';

export interface UnifiedMediaEngineContainer {
  engine: UnifiedMediaEngine;
  repository: UnifiedMediaRepository;
}

export interface UnifiedMediaEngineContainerOptions {
  xtreamRepository?: XtreamRepository;
  m3uRepository?: M3URepository;
}

export function createUnifiedMediaEngineContainer(options: UnifiedMediaEngineContainerOptions): UnifiedMediaEngineContainer {
  const cacheRepository = new ProductionCacheRepository({
    memoryStore: new MemoryCacheStore(),
    persistentStore: new PersistentCacheStore(),
  });
  const cache = new RepositoryUnifiedMediaCache(cacheRepository);
  const engine = new ProductionUnifiedMediaEngine(cache);

  if (options.xtreamRepository) engine.registerProvider(new XtreamProvider(options.xtreamRepository));
  if (options.m3uRepository) engine.registerProvider(new M3UProvider(options.m3uRepository));

  return { engine, repository: new EngineBackedUnifiedMediaRepository(engine) };
}
