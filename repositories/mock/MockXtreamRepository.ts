import { Category } from '@/types/category';
import { Channel } from '@/types/channel';
import { Episode } from '@/types/episode';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';
import { Page, PageRequest } from '../common';
import { XtreamRepository, XtreamRepositoryStatus } from '../XtreamRepository';
import { mockCategories, mockChannels, mockEpisodes, mockMovies, mockSeries, XTREAM_PLAYLIST_ID } from './mockDomainData';
import { pageItems, wait } from './paging';

export class MockXtreamRepository implements XtreamRepository {
  async getStatus(playlistId: string): Promise<XtreamRepositoryStatus> {
    await wait();
    return { playlistId, isConfigured: playlistId === XTREAM_PLAYLIST_ID, isAuthenticated: playlistId === XTREAM_PLAYLIST_ID, lastMockedAt: new Date().toISOString() };
  }

  async listLiveCategories(playlistId: string, page?: PageRequest): Promise<Page<Category>> {
    await wait();
    return pageItems(mockCategories.filter((category) => category.playlistId === playlistId && category.kind === 'channel'), page);
  }

  async listVodCategories(playlistId: string, page?: PageRequest): Promise<Page<Category>> {
    await wait();
    return pageItems(mockCategories.filter((category) => category.playlistId === playlistId && category.kind === 'movie'), page);
  }

  async listSeriesCategories(playlistId: string, page?: PageRequest): Promise<Page<Category>> {
    await wait();
    return pageItems(mockCategories.filter((category) => category.playlistId === playlistId && category.kind === 'series'), page);
  }

  async listChannels(playlistId: string, categoryId?: string, page?: PageRequest): Promise<Page<Channel>> {
    await wait();
    const items = mockChannels.filter((item) => item.playlistId === playlistId && (!categoryId || item.categoryIds.includes(categoryId)));
    return pageItems(items, page);
  }

  async listMovies(playlistId: string, categoryId?: string, page?: PageRequest): Promise<Page<Movie>> {
    await wait();
    const items = mockMovies.filter((item) => item.playlistId === playlistId && (!categoryId || item.categoryIds.includes(categoryId)));
    return pageItems(items, page);
  }

  async listSeries(playlistId: string, categoryId?: string, page?: PageRequest): Promise<Page<Series>> {
    await wait();
    const items = mockSeries.filter((item) => item.playlistId === playlistId && (!categoryId || item.categoryIds.includes(categoryId)));
    return pageItems(items, page);
  }

  async listEpisodes(playlistId: string, seriesId: string, seasonNumber?: number, page?: PageRequest): Promise<Page<Episode>> {
    await wait();
    const items = mockEpisodes.filter((item) => item.playlistId === playlistId && item.seriesId === seriesId && (!seasonNumber || item.seasonNumber === seasonNumber));
    return pageItems(items, page);
  }
}
