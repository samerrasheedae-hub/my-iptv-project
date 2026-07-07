import { UnifiedMediaEngine } from '@/media/engine/UnifiedMediaEngine';
import {
  UnifiedCategory,
  UnifiedCategoryMediaRequest,
  UnifiedCategoryRequest,
  UnifiedHomeFeed,
  UnifiedMediaItem,
  UnifiedPage,
  UnifiedProviderKind,
  UnifiedSearchRequest,
} from '@/media/types';

export interface UnifiedMediaRepository {
  listCategories(request: UnifiedCategoryRequest): Promise<UnifiedPage<UnifiedCategory>>;
  listMediaByCategory(request: UnifiedCategoryMediaRequest): Promise<UnifiedPage<UnifiedMediaItem>>;
  search(request: UnifiedSearchRequest): Promise<UnifiedPage<UnifiedMediaItem>>;
  getHomeFeed(playlistIds?: Partial<Record<UnifiedProviderKind, string>>): Promise<UnifiedHomeFeed>;
}

export class EngineBackedUnifiedMediaRepository implements UnifiedMediaRepository {
  constructor(private readonly engine: UnifiedMediaEngine) {}

  listCategories(request: UnifiedCategoryRequest): Promise<UnifiedPage<UnifiedCategory>> {
    return this.engine.listCategories(request);
  }

  listMediaByCategory(request: UnifiedCategoryMediaRequest): Promise<UnifiedPage<UnifiedMediaItem>> {
    return this.engine.listMediaByCategory(request);
  }

  search(request: UnifiedSearchRequest): Promise<UnifiedPage<UnifiedMediaItem>> {
    return this.engine.search(request);
  }

  getHomeFeed(playlistIds?: Partial<Record<UnifiedProviderKind, string>>): Promise<UnifiedHomeFeed> {
    return this.engine.getHomeFeed(playlistIds);
  }
}
