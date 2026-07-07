export type XtreamContentKind = 'live' | 'movie' | 'series';
export type XtreamAuthStatus = 'anonymous' | 'authenticated' | 'expired' | 'error';
export type XtreamSyncStatus = 'idle' | 'syncing' | 'paused' | 'error';

export interface XtreamSession {
  id: string;
  playlistId: string;
  accountId: string;
  status: XtreamAuthStatus;
  authenticatedAt: string;
  expiresAt?: string;
}

export interface XtreamAccountInfo {
  playlistId: string;
  accountId: string;
  username: string;
  status: 'active' | 'disabled' | 'expired' | 'unknown';
  maxConnections?: number;
  activeConnections?: number;
  expiresAt?: string;
  serverTime?: string;
  allowedOutputFormats: string[];
}

export interface XtreamCategory {
  id: string;
  playlistId: string;
  kind: XtreamContentKind;
  title: string;
  parentId?: string;
  itemCountEstimate?: number;
  sortOrder: number;
  updatedAt: string;
}

export interface XtreamStreamSummary {
  id: string;
  playlistId: string;
  categoryId: string;
  kind: XtreamContentKind;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseYear?: number;
  durationSeconds?: number;
  rating?: number;
  isLive: boolean;
  updatedAt: string;
}

export interface XtreamPageRequest {
  limit: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface XtreamPage<T> {
  items: T[];
  nextCursor?: string;
  totalEstimate?: number;
}

export interface XtreamAuthenticationInput {
  playlistId: string;
  username: string;
  passwordRef: string;
  serverUrlRef?: string;
  signal?: AbortSignal;
}

export interface XtreamCategoryRequest extends XtreamPageRequest {
  playlistId: string;
  kind: XtreamContentKind;
}

export interface XtreamStreamsByCategoryRequest extends XtreamPageRequest {
  playlistId: string;
  categoryId: string;
  kind: XtreamContentKind;
  forceRefresh?: boolean;
}


export interface XtreamPlaybackSource {
  id: string;
  playlistId: string;
  streamId: string;
  kind: XtreamContentKind;
  uri: string;
  containerExtension: string;
  isLive: boolean;
  resolvedAt: string;
}

export interface XtreamStreamResolutionRequest {
  playlistId: string;
  streamId: string;
  kind: XtreamContentKind;
  outputFormat?: string;
}

export interface XtreamEngineState {
  playlistId?: string;
  session?: XtreamSession;
  account?: XtreamAccountInfo;
  syncStatus: XtreamSyncStatus;
  cachedCategoryIds: string[];
  lastError?: string;
  updatedAt: string;
}
