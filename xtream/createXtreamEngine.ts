import { createNetworkLayer, NetworkRepository } from '@/network';
import { MemoryCacheStore, PersistentCacheStore, ProductionCacheRepository } from '@/cache';
import { RepositoryXtreamCacheLayer, XtreamCacheLayer } from '@/xtream/cache/XtreamCacheLayer';
import { XtreamBackgroundSyncEngine } from '@/xtream/engine/BackgroundSyncEngine';
import { ProductionXtreamEngine, XtreamEngine } from '@/xtream/engine/XtreamEngine';
import { EngineBackedXtreamRepository, XtreamRepository } from '@/xtream/repositories/XtreamRepository';
import { BackendXtreamService, XtreamService } from '@/xtream/services/XtreamService';
import { XtreamFetchTransport } from '@/xtream/services/XtreamFetchTransport';

export interface XtreamEngineContainer {
  service: XtreamService;
  cache: XtreamCacheLayer;
  engine: XtreamEngine;
  repository: XtreamRepository;
  backgroundSync: XtreamBackgroundSyncEngine;
}

export interface XtreamEngineContainerOptions {
  networkRepository?: NetworkRepository;
}

export function createXtreamEngineContainer(options: XtreamEngineContainerOptions = {}): XtreamEngineContainer {
  const networkRepository = options.networkRepository ?? createNetworkLayer({
    transport: new XtreamFetchTransport(),
    baseUrl: 'https://xtream-placeholder.local',
    rateLimit: { maxRequests: 4, perMilliseconds: 1000 },
  }).networkRepository;
  const cacheRepository = new ProductionCacheRepository({
    memoryStore: new MemoryCacheStore(),
    persistentStore: new PersistentCacheStore(),
  });
  const cache = new RepositoryXtreamCacheLayer(cacheRepository);
  const service = new BackendXtreamService(networkRepository);
  const engine = new ProductionXtreamEngine(service, cache);
  const backgroundSync = new XtreamBackgroundSyncEngine(engine, cache);
  const repository = new EngineBackedXtreamRepository(engine, backgroundSync);

  return { service, cache, engine, repository, backgroundSync };
}
