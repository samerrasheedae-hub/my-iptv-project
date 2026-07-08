import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContinueWatching, Favorite } from '@/types/userLibrary';
import { Page, PageRequest, RepositoryMutationResult } from '../common';
import { FavoriteInput, PlaybackProgressInput, UserLibraryRepository } from '../UserLibraryRepository';

const FAVORITES_KEY = '@iptv:favorites';
const CONTINUE_WATCHING_KEY = '@iptv:continue_watching';

const timestamp = () => new Date().toISOString();

const pageItems = <T>(items: T[], page?: PageRequest): Page<T> => ({
  items: page?.limit ? items.slice(0, page.limit) : items,
  totalEstimate: items.length,
});

async function loadMap<T>(key: string, getId: (item: T) => string): Promise<Map<string, T>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const arr: T[] = raw ? JSON.parse(raw) : [];
    return new Map(arr.map((item) => [getId(item), item]));
  } catch {
    return new Map();
  }
}

async function saveMap<T>(key: string, map: Map<string, T>): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify([...map.values()]));
}

export class ProductionUserLibraryRepository implements UserLibraryRepository {
  constructor(private readonly onChange?: () => void) {}

  async listContinueWatching(page?: PageRequest): Promise<Page<ContinueWatching>> {
    const map = await loadMap<ContinueWatching>(CONTINUE_WATCHING_KEY, (cw) => cw.mediaId);
    const sorted = [...map.values()].sort((a, b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt));
    return pageItems(sorted, page);
  }

  async getContinueWatching(mediaId: string): Promise<ContinueWatching | undefined> {
    const map = await loadMap<ContinueWatching>(CONTINUE_WATCHING_KEY, (cw) => cw.mediaId);
    return map.get(mediaId);
  }

  async savePlaybackProgress(input: PlaybackProgressInput): Promise<RepositoryMutationResult> {
    const map = await loadMap<ContinueWatching>(CONTINUE_WATCHING_KEY, (cw) => cw.mediaId);
    const progress = input.durationSeconds > 0
      ? Math.min(1, Math.max(0, input.positionSeconds / input.durationSeconds))
      : 0;
    map.set(input.mediaId, {
      id: `cw-${input.mediaId}`,
      playlistId: input.playlistId,
      mediaId: input.mediaId,
      mediaKind: input.mediaKind,
      seriesId: input.seriesId,
      episodeId: input.episodeId,
      title: input.title,
      posterUrl: input.posterUrl,
      backdropUrl: input.backdropUrl,
      positionSeconds: input.positionSeconds,
      durationSeconds: input.durationSeconds,
      progress,
      lastWatchedAt: timestamp(),
      updatedAt: timestamp(),
    });
    await saveMap(CONTINUE_WATCHING_KEY, map);
    this.onChange?.();
    return { success: true, updatedAt: timestamp() };
  }

  async removeContinueWatching(mediaId: string): Promise<RepositoryMutationResult> {
    const map = await loadMap<ContinueWatching>(CONTINUE_WATCHING_KEY, (cw) => cw.mediaId);
    map.delete(mediaId);
    await saveMap(CONTINUE_WATCHING_KEY, map);
    this.onChange?.();
    return { success: true, updatedAt: timestamp() };
  }

  async listFavorites(page?: PageRequest): Promise<Page<Favorite>> {
    const map = await loadMap<Favorite>(FAVORITES_KEY, (f) => f.mediaId);
    const sorted = [...map.values()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return pageItems(sorted, page);
  }

  async isFavorite(mediaId: string): Promise<boolean> {
    const map = await loadMap<Favorite>(FAVORITES_KEY, (f) => f.mediaId);
    return map.has(mediaId);
  }

  async addFavorite(input: FavoriteInput): Promise<RepositoryMutationResult> {
    const map = await loadMap<Favorite>(FAVORITES_KEY, (f) => f.mediaId);
    map.set(input.mediaId, {
      id: `fav-${input.mediaId}`,
      playlistId: input.playlistId,
      mediaId: input.mediaId,
      mediaKind: input.mediaKind,
      title: input.title,
      posterUrl: input.posterUrl,
      createdAt: timestamp(),
      sortOrder: map.size,
    });
    await saveMap(FAVORITES_KEY, map);
    this.onChange?.();
    return { success: true, updatedAt: timestamp() };
  }

  async removeFavorite(mediaId: string): Promise<RepositoryMutationResult> {
    const map = await loadMap<Favorite>(FAVORITES_KEY, (f) => f.mediaId);
    map.delete(mediaId);
    await saveMap(FAVORITES_KEY, map);
    this.onChange?.();
    return { success: true, updatedAt: timestamp() };
  }
}
