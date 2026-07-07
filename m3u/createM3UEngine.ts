import { MemoryCacheStore, PersistentCacheStore, ProductionCacheRepository } from '@/cache';
import { createNetworkLayer, NetworkRepository } from '@/network';
import { RepositoryM3UCacheLayer, M3UCacheLayer } from '@/m3u/cache/M3UCacheLayer';
import { ProductionBackgroundM3UParsingWorker, BackgroundM3UParsingWorker } from '@/m3u/engine/BackgroundM3UParsingWorker';
import { M3UEngine, ProductionM3UEngine } from '@/m3u/engine/M3UEngine';
import { EngineBackedM3URepository, M3URepository } from '@/m3u/repositories/M3URepository';
import { BackendM3UService, M3UService } from '@/m3u/services/M3UService';

export interface M3UEngineContainer {
  service: M3UService;
  cache: M3UCacheLayer;
  engine: M3UEngine;
  repository: M3URepository;
  backgroundWorker: BackgroundM3UParsingWorker;
}

export interface M3UEngineContainerOptions {
  networkRepository?: NetworkRepository;
}

export function createM3UEngineContainer(options: M3UEngineContainerOptions = {}): M3UEngineContainer {
  const networkRepository = options.networkRepository ?? createNetworkLayer({
    baseUrl: 'https://backend-placeholder.local',
    rateLimit: { maxRequests: 4, perMilliseconds: 1000 },
  }).networkRepository;

  const cacheRepository = new ProductionCacheRepository({
    memoryStore: new MemoryCacheStore(),
    persistentStore: new PersistentCacheStore(),
  });
  const cache = new RepositoryM3UCacheLayer(cacheRepository);
  const service = new BackendM3UService(networkRepository);
  const engine = new ProductionM3UEngine(service, cache);
  const backgroundWorker = new ProductionBackgroundM3UParsingWorker(engine, cache);
  const repository = new EngineBackedM3URepository(engine, backgroundWorker);

  return { service, cache, engine, repository, backgroundWorker };
}
