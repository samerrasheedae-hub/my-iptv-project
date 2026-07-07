import { Category } from '@/types/category';
import { Channel } from '@/types/channel';
import { Episode } from '@/types/episode';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';
import { Page, PageRequest } from './common';

export interface XtreamConnectionInfo {
  playlistId: string;
  serverUrl: string;
  usernameRef: string;
}

export interface XtreamRepositoryStatus {
  playlistId: string;
  isConfigured: boolean;
  isAuthenticated: boolean;
  lastMockedAt: string;
}

export interface XtreamRepository {
  getStatus(playlistId: string): Promise<XtreamRepositoryStatus>;
  listLiveCategories(playlistId: string, page?: PageRequest): Promise<Page<Category>>;
  listVodCategories(playlistId: string, page?: PageRequest): Promise<Page<Category>>;
  listSeriesCategories(playlistId: string, page?: PageRequest): Promise<Page<Category>>;
  listChannels(playlistId: string, categoryId?: string, page?: PageRequest): Promise<Page<Channel>>;
  listMovies(playlistId: string, categoryId?: string, page?: PageRequest): Promise<Page<Movie>>;
  listSeries(playlistId: string, categoryId?: string, page?: PageRequest): Promise<Page<Series>>;
  listEpisodes(playlistId: string, seriesId: string, seasonNumber?: number, page?: PageRequest): Promise<Page<Episode>>;
}
