import { RateLimitPolicy } from './types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class RateLimiter {
  private timestamps: number[] = [];

  constructor(private readonly policy?: RateLimitPolicy) {}

  async waitForSlot(): Promise<void> {
    const policy = this.policy;
    if (!policy) return;
    const now = Date.now();
    this.timestamps = this.timestamps.filter((time) => now - time < policy.perMilliseconds);

    if (this.timestamps.length >= policy.maxRequests) {
      const oldest = this.timestamps[0] ?? now;
      const delay = Math.max(0, policy.perMilliseconds - (now - oldest));
      await wait(delay);
      return this.waitForSlot();
    }

    this.timestamps.push(Date.now());
  }
}
