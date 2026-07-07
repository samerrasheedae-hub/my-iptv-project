import { appConfig } from '@/config/env';
import { AppLogger } from '@/stability/AppLogger';

export async function measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    return await operation();
  } finally {
    if (appConfig.enablePerformanceLogs) {
      AppLogger.info('performance', { name, durationMs: Date.now() - startedAt });
    }
  }
}
