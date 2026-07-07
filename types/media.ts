export type MediaProviderType = 'xtream' | 'm3u' | 'local' | 'unknown';
export type MediaKind = 'channel' | 'movie' | 'series' | 'episode';
export type StreamKind = 'live' | 'vod' | 'series';
export type MediaImageRole = 'poster' | 'backdrop' | 'logo' | 'thumbnail';

export interface ProviderRef {
  providerType: MediaProviderType;
  playlistId: string;
  externalId: string;
  rawCategoryId?: string;
  sourceUri?: string;
}

export interface MediaImage {
  role: MediaImageRole;
  url: string;
  width?: number;
  height?: number;
  blurHash?: string;
}

export interface MediaRating {
  source: 'imdb' | 'tmdb' | 'user' | 'provider' | 'unknown';
  value: number;
  maxValue: number;
  votes?: number;
}

export interface MediaSummary {
  id: string;
  kind: MediaKind;
  title: string;
  subtitle?: string;
  description?: string;
  categoryIds: string[];
  images: MediaImage[];
  provider: ProviderRef;
  releaseYear?: number;
  maturityRating?: string;
  durationSeconds?: number;
  genres?: string[];
  rating?: MediaRating;
  sortTitle: string;
  searchText: string;
  updatedAt: string;
}

export interface StreamSourceRef {
  id: string;
  provider: ProviderRef;
  kind: StreamKind;
  containerExtension?: string;
  mimeType?: string;
  qualityLabel?: string;
  isAdaptive?: boolean;
  // Resolved playable URLs must be supplied by future provider adapters/repositories.
  // They are intentionally not stored on UI-facing models yet.
}
