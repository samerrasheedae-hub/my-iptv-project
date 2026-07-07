import { Category } from '@/types/category';
import { Channel } from '@/types/channel';
import { Page, PageRequest } from '../common';
import { M3URepository, M3URepositoryStatus } from '../M3URepository';
import { M3U_PLAYLIST_ID, mockCategories, mockM3UChannels } from './mockDomainData';
import { pageItems, wait } from './paging';

export class MockM3URepository implements M3URepository {
  async getStatus(playlistId: string): Promise<M3URepositoryStatus> {
    await wait();
    return { playlistId, isConfigured: playlistId === M3U_PLAYLIST_ID, itemCount: mockM3UChannels.length, lastMockedAt: new Date().toISOString() };
  }

  async listGroups(playlistId: string, page?: PageRequest): Promise<Page<Category>> {
    await wait();
    return pageItems(mockCategories.filter((category) => category.playlistId === playlistId), page);
  }

  async listChannels(playlistId: string, groupId?: string, page?: PageRequest): Promise<Page<Channel>> {
    await wait();
    const items = mockM3UChannels.filter((item) => item.playlistId === playlistId && (!groupId || item.categoryIds.includes(groupId)));
    return pageItems(items, page);
  }
}
