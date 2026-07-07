import { Category } from './category';
import { Channel } from './channel';
import { Episode } from './episode';
import { MediaKind, MediaSummary } from './media';
import { Movie } from './movie';
import { Series } from './series';

export type SearchResultKind = MediaKind | 'category';

export interface SearchResult {
  id: string;
  resultKind: SearchResultKind;
  score: number;
  matchedText: string;
  summary: MediaSummary;
}

export interface SearchQuery {
  text: string;
  playlistIds?: string[];
  kinds?: SearchResultKind[];
  categoryIds?: string[];
  limit?: number;
  cursor?: string;
}

export interface SearchResultsPage {
  query: SearchQuery;
  results: SearchResult[];
  totalEstimate?: number;
  nextCursor?: string;
}

export type HydratedSearchResult =
  | { resultKind: 'channel'; item: Channel }
  | { resultKind: 'movie'; item: Movie }
  | { resultKind: 'series'; item: Series }
  | { resultKind: 'episode'; item: Episode }
  | { resultKind: 'category'; item: Category };
