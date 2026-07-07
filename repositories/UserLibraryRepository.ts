import { MediaKind } from '@/types/media';
import { ContinueWatching, Favorite } from '@/types/userLibrary';
import { Page, PageRequest, RepositoryMutationResult } from './common';

export interface PlaybackProgressInput {
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
}

export interface FavoriteInput {
  playlistId: string;
  mediaId: string;
  mediaKind: MediaKind | 'category';
  title: string;
  posterUrl?: string;
}

export interface UserLibraryRepository {
  listContinueWatching(page?: PageRequest): Promise<Page<ContinueWatching>>;
  getContinueWatching(mediaId: string): Promise<ContinueWatching | undefined>;
  savePlaybackProgress(input: PlaybackProgressInput): Promise<RepositoryMutationResult>;
  removeContinueWatching(mediaId: string): Promise<RepositoryMutationResult>;
  listFavorites(page?: PageRequest): Promise<Page<Favorite>>;
  isFavorite(mediaId: string): Promise<boolean>;
  addFavorite(input: FavoriteInput): Promise<RepositoryMutationResult>;
  removeFavorite(mediaId: string): Promise<RepositoryMutationResult>;
}
