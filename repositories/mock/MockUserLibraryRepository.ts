import { mockCatalogItems } from '@/data/mockContent';
import { ContinueWatching, Favorite } from '@/types/userLibrary';
import { Page, PageRequest, RepositoryMutationResult } from '../common';
import { FavoriteInput, PlaybackProgressInput, UserLibraryRepository } from '../UserLibraryRepository';
import { findMockContentItem, XTREAM_PLAYLIST_ID } from './mockDomainData';
import { pageItems, wait } from './paging';

const timestamp = () => new Date().toISOString();

export class MockUserLibraryRepository implements UserLibraryRepository {
  private favorites = new Map<string, Favorite>();
  private continueWatching = new Map<string, ContinueWatching>();

  constructor(private readonly onChange?: () => void) {
    mockCatalogItems.filter((item) => item.isInMyList).forEach((item, index) => {
      this.favorites.set(item.id, {
        id: `fav-${item.id}`,
        playlistId: XTREAM_PLAYLIST_ID,
        mediaId: item.id,
        mediaKind: item.kind === 'live' ? 'channel' : item.kind === 'collection' ? 'movie' : item.kind,
        title: item.title,
        posterUrl: item.posterUrl,
        createdAt: timestamp(),
        sortOrder: index,
      });
    });

    mockCatalogItems.filter((item) => item.progress && item.kind !== 'live').forEach((item) => {
      this.continueWatching.set(item.id, {
        id: `cw-${item.id}`,
        playlistId: XTREAM_PLAYLIST_ID,
        mediaId: item.id,
        mediaKind: item.kind === 'series' ? 'series' : 'movie',
        seriesId: item.kind === 'series' ? item.id : undefined,
        title: item.title,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        positionSeconds: Math.round((item.progress ?? 0) * 3600),
        durationSeconds: 3600,
        progress: item.progress ?? 0,
        lastWatchedAt: timestamp(),
        updatedAt: timestamp(),
      });
    });
  }

  async listContinueWatching(page?: PageRequest): Promise<Page<ContinueWatching>> {
    await wait(90);
    return pageItems([...this.continueWatching.values()].sort((a, b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt)), page);
  }

  async getContinueWatching(mediaId: string): Promise<ContinueWatching | undefined> {
    await wait(60);
    return this.continueWatching.get(mediaId);
  }

  async savePlaybackProgress(input: PlaybackProgressInput): Promise<RepositoryMutationResult> {
    await wait(60);
    const progress = input.durationSeconds > 0 ? Math.min(1, Math.max(0, input.positionSeconds / input.durationSeconds)) : 0;
    this.continueWatching.set(input.mediaId, {
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
    this.onChange?.();
    return { success: true, updatedAt: timestamp() };
  }

  async removeContinueWatching(mediaId: string): Promise<RepositoryMutationResult> {
    await wait(60);
    this.continueWatching.delete(mediaId);
    this.onChange?.();
    return { success: true, updatedAt: timestamp() };
  }

  async listFavorites(page?: PageRequest): Promise<Page<Favorite>> {
    await wait(90);
    return pageItems([...this.favorites.values()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), page);
  }

  async isFavorite(mediaId: string): Promise<boolean> {
    await wait(40);
    return this.favorites.has(mediaId);
  }

  async addFavorite(input: FavoriteInput): Promise<RepositoryMutationResult> {
    await wait(60);
    this.favorites.set(input.mediaId, {
      id: `fav-${input.mediaId}`,
      playlistId: input.playlistId,
      mediaId: input.mediaId,
      mediaKind: input.mediaKind,
      title: input.title,
      posterUrl: input.posterUrl,
      createdAt: timestamp(),
      sortOrder: this.favorites.size,
    });
    this.onChange?.();
    return { success: true, updatedAt: timestamp() };
  }

  async removeFavorite(mediaId: string): Promise<RepositoryMutationResult> {
    await wait(60);
    this.favorites.delete(mediaId);
    this.onChange?.();
    return { success: true, updatedAt: timestamp() };
  }

  async toggleFromMockItem(mediaId: string) {
    const item = findMockContentItem(mediaId);
    if (!item) return;
    if (await this.isFavorite(mediaId)) await this.removeFavorite(mediaId);
    else await this.addFavorite({ playlistId: XTREAM_PLAYLIST_ID, mediaId, mediaKind: item.kind === 'live' ? 'channel' : item.kind === 'collection' ? 'movie' : item.kind, title: item.title, posterUrl: item.posterUrl });
  }
}
