import { MediaImage, MediaRating, ProviderRef } from './media';

export interface SeriesSeasonSummary {
  seasonNumber: number;
  title?: string;
  episodeCount: number;
  posterUrl?: string;
}

export interface Series {
  id: string;
  playlistId: string;
  title: string;
  originalTitle?: string;
  categoryIds: string[];
  provider: ProviderRef;
  images: MediaImage[];
  overview?: string;
  firstAirDate?: string;
  releaseYear?: number;
  maturityRating?: string;
  genres: string[];
  cast?: string[];
  director?: string;
  country?: string;
  rating?: MediaRating;
  seasons: SeriesSeasonSummary[];
  totalEpisodes?: number;
  status?: 'returning' | 'ended' | 'unknown';
  sortTitle: string;
  searchText: string;
  createdAt: string;
  updatedAt: string;
}
