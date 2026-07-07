import { Playlist } from '@/types/playlist';
import { Page, PageRequest } from './common';

export interface PlaylistRepository {
  listPlaylists(page?: PageRequest): Promise<Page<Playlist>>;
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getActivePlaylist(): Promise<Playlist | undefined>;
  setActivePlaylist(id: string): Promise<void>;
}
