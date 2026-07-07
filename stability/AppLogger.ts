import { appConfig } from '@/config/env';

type Context = Record<string, unknown>;

export class AppLogger {
  static debug(message: string, context?: Context) {
    if (appConfig.isProduction || !appConfig.enableDebugLogs) return;
    console.debug(`[app] ${message}`, context ?? '');
  }

  static info(message: string, context?: Context) {
    if (appConfig.isProduction) return;
    console.info(`[app] ${message}`, context ?? '');
  }

  static warn(message: string, context?: Context) {
    if (appConfig.isProduction) return;
    console.warn(`[app] ${message}`, context ?? '');
  }

  static error(message: string, context?: Context) {
    if (appConfig.isProduction) return;
    console.error(`[app] ${message}`, context ?? '');
  }
}
