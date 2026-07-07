import { MediaProviderType } from './media';

export type PlaylistStatus = 'inactive' | 'syncing' | 'ready' | 'error';
export type PlaylistAuthKind = 'xtream_credentials' | 'm3u_url' | 'local_file' | 'none';

export interface PlaylistCapabilities {
  supportsLive: boolean;
  supportsMovies: boolean;
  supportsSeries: boolean;
  supportsEpg: boolean;
  supportsCatchup: boolean;
  supportsSearch: boolean;
}

export interface PlaylistSyncStats {
  channelCount: number;
  movieCount: number;
  seriesCount: number;
  episodeCount: number;
  categoryCount: number;
  lastSyncedAt?: string;
  nextSyncAt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  providerType: MediaProviderType;
  authKind: PlaylistAuthKind;
  status: PlaylistStatus;
  capabilities: PlaylistCapabilities;
  syncStats: PlaylistSyncStats;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}
