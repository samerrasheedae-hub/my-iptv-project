import { Playlist } from '@/types/playlist';
import { Page, PageRequest } from '../common';
import { PlaylistRepository } from '../PlaylistRepository';
import { mockPlaylists, XTREAM_PLAYLIST_ID } from './mockDomainData';
import { pageItems, wait } from './paging';

export class MockPlaylistRepository implements PlaylistRepository {
  private activePlaylistId = XTREAM_PLAYLIST_ID;

  async listPlaylists(page?: PageRequest): Promise<Page<Playlist>> {
    await wait();
    return pageItems(mockPlaylists, page);
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    await wait(80);
    return mockPlaylists.find((playlist) => playlist.id === id);
  }

  async getActivePlaylist(): Promise<Playlist | undefined> {
    await wait(80);
    return mockPlaylists.find((playlist) => playlist.id === this.activePlaylistId);
  }

  async setActivePlaylist(id: string): Promise<void> {
    await wait(80);
    if (mockPlaylists.some((playlist) => playlist.id === id)) this.activePlaylistId = id;
  }

  async addPlaylist(_playlist: Playlist): Promise<void> {
    await wait(50);
  }

  async removePlaylist(_id: string): Promise<void> {
    await wait(50);
  }
}
