import { MediaImage, ProviderRef, StreamSourceRef } from './media';

export interface EpgProgramSummary {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  progress?: number;
}

export interface Channel {
  id: string;
  playlistId: string;
  title: string;
  channelNumber?: number;
  categoryIds: string[];
  provider: ProviderRef;
  images: MediaImage[];
  stream: StreamSourceRef;
  epgChannelId?: string;
  currentProgram?: EpgProgramSummary;
  nextProgram?: EpgProgramSummary;
  catchupDays?: number;
  isAdult?: boolean;
  isLive: true;
  sortTitle: string;
  searchText: string;
  createdAt: string;
  updatedAt: string;
}
