import { PlayerRouteContext } from '@/player/routeParams';

export type ContentKind = 'movie' | 'series' | 'live' | 'collection';

export interface ContentItem {
  id: string;
  title: string;
  kind: ContentKind;
  posterUrl: string;
  backdropUrl: string;
  year?: string;
  maturityRating?: string;
  durationLabel?: string;
  progress?: number;
  isInMyList?: boolean;
  isDownloaded?: boolean;
  genres: string[];
  overview: string;
  playerRouteContext?: PlayerRouteContext;
}

export interface ContentRowModel {
  id: string;
  title: string;
  items: ContentItem[];
  variant?: 'poster' | 'landscape' | 'continueWatching';
}

export interface HomeCatalogModel {
  hero: ContentItem;
  rows: ContentRowModel[];
}

export interface CatalogRepository {
  getHomeCatalog(): Promise<HomeCatalogModel>;
  search(query: string): Promise<ContentItem[]>;
  getMyList(): Promise<ContentItem[]>;
  getDownloads(): Promise<ContentItem[]>;
  getById(id: string): Promise<ContentItem | undefined>;
  toggleMyList(id: string): Promise<void>;
  toggleDownload(id: string): Promise<void>;
  setProgress(id: string, progress: number): Promise<void>;
}
