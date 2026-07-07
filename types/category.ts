import { MediaKind, ProviderRef } from './media';

export interface Category {
  id: string;
  playlistId: string;
  title: string;
  kind: MediaKind | 'mixed';
  parentId?: string;
  provider: ProviderRef;
  itemCount?: number;
  sortOrder: number;
  isHidden?: boolean;
  createdAt: string;
  updatedAt: string;
}
