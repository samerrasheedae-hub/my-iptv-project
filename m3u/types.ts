export type M3USourceKind = 'remote_url' | 'local_file';
export type M3USyncStatus = 'idle' | 'indexing' | 'syncing' | 'paused' | 'error';
export type M3UStreamKind = 'live' | 'movie' | 'series' | 'unknown';

export interface M3USourceDescriptor {
  playlistId: string;
  kind: M3USourceKind;
  uri: string;
  displayName: string;
  epgUri?: string;
  headers?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface M3USourceStatus {
  playlistId: string;
  available: boolean;
  lastCheckedAt: string;
  contentLengthEstimate?: number;
  errorMessage?: string;
}

export interface M3UCategory {
  id: string;
  playlistId: string;
  title: string;
  groupTitle: string;
  itemCountEstimate?: number;
  sortOrder: number;
  updatedAt: string;
}

export interface M3UStreamMetadata {
  id: string;
  playlistId: string;
  categoryId: string;
  title: string;
  url: string;
  logoUrl?: string;
  tvgId?: string;
  tvgName?: string;
  groupTitle: string;
  kind: M3UStreamKind;
  catchup?: string;
  catchupSource?: string;
  rawAttributes: Record<string, string>;
  updatedAt: string;
}

export interface M3UPageRequest {
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface M3UPage<T> {
  items: T[];
  nextCursor?: string;
  totalEstimate?: number;
}

export interface M3URegisterSourceInput {
  playlistId: string;
  kind: M3USourceKind;
  uri: string;
  displayName: string;
  epgUri?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface M3UCategoryRequest extends M3UPageRequest {
  playlistId: string;
}

export interface M3UStreamsByCategoryRequest extends M3UPageRequest {
  playlistId: string;
  categoryId: string;
  forceRefresh?: boolean;
}

export interface M3UEngineState {
  playlistId?: string;
  source?: M3USourceDescriptor;
  syncStatus: M3USyncStatus;
  cachedCategoryIds: string[];
  lastError?: string;
  updatedAt: string;
}

export interface ParsedM3UEntry {
  title: string;
  url: string;
  attributes: Record<string, string>;
  groupTitle: string;
}
