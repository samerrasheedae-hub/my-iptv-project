import { Category } from '@/types/category';
import { Channel } from '@/types/channel';
import { Page, PageRequest } from './common';

export interface M3UPlaylistSource {
  playlistId: string;
  sourceUri: string;
  epgUri?: string;
}

export interface M3URepositoryStatus {
  playlistId: string;
  isConfigured: boolean;
  itemCount: number;
  lastMockedAt: string;
}

export interface M3URepository {
  getStatus(playlistId: string): Promise<M3URepositoryStatus>;
  listGroups(playlistId: string, page?: PageRequest): Promise<Page<Category>>;
  listChannels(playlistId: string, groupId?: string, page?: PageRequest): Promise<Page<Channel>>;
}
