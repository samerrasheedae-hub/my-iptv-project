export type UnifiedProviderKind = 'xtream' | 'm3u';
export type UnifiedMediaKind = 'channel' | 'movie' | 'series';

export interface UnifiedProviderRef {
  providerKind: UnifiedProviderKind;
  playlistId: string;
  externalId: string;
  categoryId?: string;
}

export interface UnifiedCategory {
  id: string;
  playlistId: string;
  providerKind: UnifiedProviderKind;
  title: string;
  kind: UnifiedMediaKind | 'mixed';
  itemCountEstimate?: number;
  sortOrder: number;
  updatedAt: string;
}

export interface UnifiedMediaBase {
  id: string;
  playlistId: string;
  providerKind: UnifiedProviderKind;
  categoryId: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  provider: UnifiedProviderRef;
  searchText: string;
  updatedAt: string;
}

export interface UnifiedChannel extends UnifiedMediaBase {
  kind: 'channel';
  streamUrl?: string;
  logoUrl?: string;
  isLive: true;
}

export interface UnifiedMovie extends UnifiedMediaBase {
  kind: 'movie';
  releaseYear?: number;
  durationSeconds?: number;
  rating?: number;
}

export interface UnifiedSeries extends UnifiedMediaBase {
  kind: 'series';
  releaseYear?: number;
  rating?: number;
  episodeCountEstimate?: number;
}

export type UnifiedMediaItem = UnifiedChannel | UnifiedMovie | UnifiedSeries;

export interface UnifiedPageRequest {
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface UnifiedPage<T> {
  items: T[];
  nextCursor?: string;
  totalEstimate?: number;
}

export interface UnifiedCategoryRequest extends UnifiedPageRequest {
  providerKind?: UnifiedProviderKind;
  playlistId?: string;
  kind?: UnifiedMediaKind | 'mixed';
}

export interface UnifiedCategoryMediaRequest extends UnifiedPageRequest {
  providerKind: UnifiedProviderKind;
  playlistId: string;
  categoryId: string;
  kind?: UnifiedMediaKind;
  forceRefresh?: boolean;
}

export interface UnifiedSearchRequest extends UnifiedPageRequest {
  query: string;
  providerKind?: UnifiedProviderKind;
  playlistId?: string;
  kinds?: UnifiedMediaKind[];
}

export interface UnifiedHomeRow {
  id: string;
  title: string;
  kind: UnifiedMediaKind | 'mixed';
  items: UnifiedMediaItem[];
  providerKind?: UnifiedProviderKind;
  playlistId?: string;
  categoryId?: string;
  nextCursor?: string;
}

export interface UnifiedHomeFeed {
  hero?: UnifiedMediaItem;
  rows: UnifiedHomeRow[];
  generatedAt: string;
}
