import { BackgroundM3UParsingWorker } from '@/m3u/engine/BackgroundM3UParsingWorker';
import { M3UEngine } from '@/m3u/engine/M3UEngine';
import {
  M3UCategory,
  M3UCategoryRequest,
  M3UEngineState,
  M3UPage,
  M3URegisterSourceInput,
  M3USourceDescriptor,
  M3USourceStatus,
  M3UStreamMetadata,
  M3UStreamsByCategoryRequest,
} from '@/m3u/types';

export interface M3URepository {
  registerSource(input: M3URegisterSourceInput): Promise<M3USourceDescriptor>;
  checkSource(playlistId: string, signal?: AbortSignal): Promise<M3USourceStatus>;
  listCategories(request: M3UCategoryRequest): Promise<M3UPage<M3UCategory>>;
  listStreamsByCategory(request: M3UStreamsByCategoryRequest): Promise<M3UPage<M3UStreamMetadata>>;
  startBackgroundParsing(playlistId: string): void;
  stopBackgroundParsing(): void;
  refreshCachedData(playlistId: string): Promise<void>;
  getEngineState(): M3UEngineState;
  cancelRequests(): void;
}

export class EngineBackedM3URepository implements M3URepository {
  constructor(
    private readonly engine: M3UEngine,
    private readonly backgroundWorker: BackgroundM3UParsingWorker,
  ) {}

  registerSource(input: M3URegisterSourceInput): Promise<M3USourceDescriptor> {
    return this.engine.registerSource(input);
  }

  checkSource(playlistId: string, signal?: AbortSignal): Promise<M3USourceStatus> {
    return this.engine.checkSource(playlistId, signal);
  }

  listCategories(request: M3UCategoryRequest): Promise<M3UPage<M3UCategory>> {
    return this.engine.loadCategories(request);
  }

  listStreamsByCategory(request: M3UStreamsByCategoryRequest): Promise<M3UPage<M3UStreamMetadata>> {
    return this.engine.loadStreamsByCategory(request);
  }

  startBackgroundParsing(playlistId: string): void {
    this.backgroundWorker.start(playlistId);
  }

  stopBackgroundParsing(): void {
    this.backgroundWorker.stop();
  }

  refreshCachedData(playlistId: string): Promise<void> {
    return this.backgroundWorker.runOnce(playlistId);
  }

  getEngineState(): M3UEngineState {
    return this.engine.getState();
  }

  cancelRequests(): void {
    this.engine.cancelAll();
  }
}

/*
 * Task 019f – 12.2 M3U functional connection layer
 */

const M3U_HEAD_TIMEOUT_MS = 4500;

/**
 * getCategoriesTask12
 */
export async function getCategoriesTask12(
  repository: { listCategories: (req: any) => Promise<any> },
  playlistId: string,
  signal?: AbortSignal
): Promise<{ data: M3UCategory[]; fromMock: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), M3U_HEAD_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const page = await repository.listCategories({
      playlistId,
      limit: 500,
      cursor: undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = Array.isArray(page?.items) ? page.items : [];
    return { data, fromMock: false };
  } catch (e) {
    clearTimeout(timeoutId);
    const fallback: M3UCategory[] = [
      {
        id: `${playlistId}:group:Fallback-News`,
        playlistId,
        title: 'News (Mock Fallback)',
        groupTitle: 'News',
        itemCountEstimate: 24,
        sortOrder: 0,
        updatedAt: new Date().toISOString(),
      } as any,
      {
        id: `${playlistId}:group:Fallback-Sports`,
        playlistId,
        title: 'Sports (Mock Fallback)',
        groupTitle: 'Sports',
        itemCountEstimate: 18,
        sortOrder: 1,
        updatedAt: new Date().toISOString(),
      } as any,
      {
        id: `${playlistId}:group:Fallback-Movies`,
        playlistId,
        title: 'Movies (Mock Fallback)',
        groupTitle: 'Movies',
        itemCountEstimate: 120,
        sortOrder: 2,
        updatedAt: new Date().toISOString(),
      } as any,
    ];
    return { data: fallback, fromMock: true };
  }
}

/**
 * listCategoriesTask12 – search wrapper
 */
export async function listCategoriesTask12(
  repository: { listCategories: (req: any) => Promise<any> },
  playlistId: string,
  q?: string,
  signal?: AbortSignal
): Promise<{ data: M3UCategory[]; fromMock: boolean }> {
  const res = await getCategoriesTask12(repository, playlistId, signal);
  let data = res.data;
  if (q && q.trim()) {
    const needle = q.toLowerCase();
    data = data.filter(c =>
      (c.title || '').toLowerCase().includes(needle) ||
      (c.groupTitle || '').toLowerCase().includes(needle)
    );
  }
  return { data, fromMock: res.fromMock };
}
