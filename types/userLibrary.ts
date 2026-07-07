import { MediaKind } from './media';

export interface ContinueWatching {
  id: string;
  playlistId: string;
  mediaId: string;
  mediaKind: Exclude<MediaKind, 'channel'>;
  seriesId?: string;
  episodeId?: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  positionSeconds: number;
  durationSeconds: number;
  progress: number;
  lastWatchedAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  playlistId: string;
  mediaId: string;
  mediaKind: MediaKind | 'category';
  title: string;
  posterUrl?: string;
  createdAt: string;
  sortOrder?: number;
}
