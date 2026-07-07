import {
  UnifiedCategory,
  UnifiedCategoryMediaRequest,
  UnifiedCategoryRequest,
  UnifiedHomeFeed,
  UnifiedPage,
  UnifiedProviderKind,
  UnifiedSearchRequest,
  UnifiedMediaItem,
} from '@/media/types';

export interface MediaProvider {
  readonly kind: UnifiedProviderKind;
  listCategories(request: UnifiedCategoryRequest): Promise<UnifiedPage<UnifiedCategory>>;
  listMediaByCategory(request: UnifiedCategoryMediaRequest): Promise<UnifiedPage<UnifiedMediaItem>>;
  search(request: UnifiedSearchRequest): Promise<UnifiedPage<UnifiedMediaItem>>;
  getHomeFeed(playlistId?: string): Promise<UnifiedHomeFeed>;
}
