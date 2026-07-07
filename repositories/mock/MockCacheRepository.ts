import { MemoryCacheStore, ProductionCacheRepository } from '@/cache';

// Backward-compatible mock cache class. The app now uses ProductionCacheRepository
// directly with memory + persistent stores, but tests can still instantiate this.
export class MockCacheRepository extends ProductionCacheRepository {
  constructor() {
    super({ memoryStore: new MemoryCacheStore(), persistentStore: new MemoryCacheStore() });
  }
}
