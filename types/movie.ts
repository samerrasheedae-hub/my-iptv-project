import { MediaImage, MediaRating, ProviderRef, StreamSourceRef } from './media';

export interface Movie {
  id: string;
  playlistId: string;
  title: string;
  originalTitle?: string;
  categoryIds: string[];
  provider: ProviderRef;
  images: MediaImage[];
  stream: StreamSourceRef;
  overview?: string;
  releaseDate?: string;
  releaseYear?: number;
  durationSeconds?: number;
  maturityRating?: string;
  genres: string[];
  cast?: string[];
  director?: string;
  country?: string;
  rating?: MediaRating;
  trailerUrl?: string;
  sortTitle: string;
  searchText: string;
  createdAt: string;
  updatedAt: string;
}
