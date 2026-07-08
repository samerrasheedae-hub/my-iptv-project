import AsyncStorage from '@react-native-async-storage/async-storage';
import { Playlist } from '@/types/playlist';
import { Page, PageRequest } from '../common';
import { PlaylistRepository } from '../PlaylistRepository';

const PLAYLISTS_KEY = '@iptv:playlists';
const ACTIVE_KEY = '@iptv:active_playlist';

const pageItems = <T>(items: T[], page?: PageRequest): Page<T> => ({
  items: page?.limit ? items.slice(0, page.limit) : items,
  totalEstimate: items.length,
});

export class ProductionPlaylistRepository implements PlaylistRepository {
  private cache: Playlist[] | null = null;

  private async load(): Promise<Playlist[]> {
    if (this.cache !== null) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(PLAYLISTS_KEY);
      this.cache = raw ? (JSON.parse(raw) as Playlist[]) : [];
    } catch {
      this.cache = [];
    }
    return this.cache;
  }

  private async persist(playlists: Playlist[]): Promise<void> {
    this.cache = playlists;
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }

  async listPlaylists(page?: PageRequest): Promise<Page<Playlist>> {
    const items = await this.load();
    return pageItems(items, page);
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const items = await this.load();
    return items.find((p) => p.id === id);
  }

  async getActivePlaylist(): Promise<Playlist | undefined> {
    const items = await this.load();
    if (items.length === 0) return undefined;
    try {
      const activeId = await AsyncStorage.getItem(ACTIVE_KEY);
      if (activeId) {
        const found = items.find((p) => p.id === activeId);
        if (found) return found;
      }
    } catch {}
    return items[0];
  }

  async setActivePlaylist(id: string): Promise<void> {
    const items = await this.load();
    if (items.some((p) => p.id === id)) {
      await AsyncStorage.setItem(ACTIVE_KEY, id);
    }
  }

  async addPlaylist(playlist: Playlist): Promise<void> {
    const items = await this.load();
    const idx = items.findIndex((p) => p.id === playlist.id);
    if (idx >= 0) {
      items[idx] = playlist;
    } else {
      items.push(playlist);
    }
    await this.persist([...items]);
  }

  async removePlaylist(id: string): Promise<void> {
    const items = await this.load();
    await this.persist(items.filter((p) => p.id !== id));
  }
}
