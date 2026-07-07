import { Category } from '@/types/category';
import { Channel } from '@/types/channel';
import { Episode } from '@/types/episode';
import { MediaKind, MediaSummary } from '@/types/media';
import { Movie } from '@/types/movie';
import { SearchQuery, SearchResultsPage } from '@/types/search';
import { Series } from '@/types/series';
import { Page, PageRequest } from './common';

export interface MediaListQuery extends PageRequest {
  playlistId?: string;
  categoryId?: string;
  kind?: MediaKind;
  sort?: 'default' | 'title' | 'recently_added' | 'release_year' | 'rating';
}

export interface HomeRowDefinition {
  id: string;
  title: string;
  kind: MediaKind | 'mixed' | 'continue_watching' | 'favorites';
  display: 'poster' | 'landscape' | 'channel_logo' | 'continue_watching';
  itemIds: string[];
  nextCursor?: string;
}

export interface HomeCatalog {
  hero?: MediaSummary;
  rows: HomeRowDefinition[];
  generatedAt: string;
}

export interface MediaCatalogRepository {
  getHomeCatalog(playlistId?: string): Promise<HomeCatalog>;
  listCategories(playlistId: string, kind?: MediaKind | 'mixed', page?: PageRequest): Promise<Page<Category>>;
  listMedia(query: MediaListQuery): Promise<Page<MediaSummary>>;
  search(query: SearchQuery): Promise<SearchResultsPage>;
  getChannel(id: string): Promise<Channel | undefined>;
  getMovie(id: string): Promise<Movie | undefined>;
  getSeries(id: string): Promise<Series | undefined>;
  listEpisodes(seriesId: string, seasonNumber?: number, page?: PageRequest): Promise<Page<Episode>>;
  getEpisode(id: string): Promise<Episode | undefined>;
}
