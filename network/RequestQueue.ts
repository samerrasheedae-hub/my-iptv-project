import { NetworkManager } from './NetworkManager';
import { RateLimiter } from './RateLimiter';
import { NetworkLogger, RateLimitPolicy, RequestPriority } from './types';
import { NoopNetworkLogger } from './logger';

interface QueueItem<T> {
  id: string;
  priority: RequestPriority;
  background: boolean;
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  createdAt: number;
}

export interface RequestQueueOptions {
  concurrency?: number;
  rateLimit?: RateLimitPolicy;
  logger?: NetworkLogger;
}

const priorityWeight: Record<RequestPriority, number> = { high: 3, normal: 2, low: 1 };

export class RequestQueue {
  private readonly queue: QueueItem<unknown>[] = [];
  private readonly rateLimiter: RateLimiter;
  private activeCount = 0;
  private sequence = 0;
  private readonly concurrency: number;
  private readonly logger: NetworkLogger;

  constructor(private readonly networkManager: NetworkManager, options: RequestQueueOptions = {}) {
    this.concurrency = options.concurrency ?? 4;
    this.rateLimiter = new RateLimiter(options.rateLimit);
    this.logger = options.logger ?? new NoopNetworkLogger();
    this.networkManager.onRecovery(() => this.drain());
  }

  add<T>(operation: () => Promise<T>, options: { id?: string; priority?: RequestPriority; background?: boolean } = {}): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        id: options.id ?? `queued-${Date.now()}-${this.sequence++}`,
        priority: options.priority ?? 'normal',
        background: Boolean(options.background),
        operation,
        resolve: resolve as (value: unknown) => void,
        reject,
        createdAt: Date.now(),
      });
      this.sortQueue();
      void this.drain();
    });
  }

  size() {
    return this.queue.length;
  }

  async drain() {
    if (!this.networkManager.isOnline()) {
      this.logger.info('Request queue paused while offline', { size: this.queue.length });
      return;
    }

    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) return;
      this.activeCount += 1;
      void this.execute(item).finally(() => {
        this.activeCount -= 1;
        void this.drain();
      });
    }
  }

  private async execute<T>(item: QueueItem<T>) {
    try {
      await this.rateLimiter.waitForSlot();
      const value = await item.operation();
      item.resolve(value);
    } catch (error) {
      item.reject(error);
    }
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      const priorityDelta = priorityWeight[b.priority] - priorityWeight[a.priority];
      return priorityDelta || a.createdAt - b.createdAt;
    });
  }
}
