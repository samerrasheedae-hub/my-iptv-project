import { appConfig } from '@/config/env';
import { NetworkLogger } from './types';

export class ConsoleNetworkLogger implements NetworkLogger {
  debug(message: string, context?: Record<string, unknown>) { if (!appConfig.isProduction) console.debug(`[network] ${message}`, context ?? ''); }
  info(message: string, context?: Record<string, unknown>) { if (!appConfig.isProduction) console.info(`[network] ${message}`, context ?? ''); }
  warn(message: string, context?: Record<string, unknown>) { if (!appConfig.isProduction) console.warn(`[network] ${message}`, context ?? ''); }
  error(message: string, context?: Record<string, unknown>) { if (!appConfig.isProduction) console.error(`[network] ${message}`, context ?? ''); }
}

export class NoopNetworkLogger implements NetworkLogger {
  debug() {}
  info() {}
  warn() {}
  error() {}
}
