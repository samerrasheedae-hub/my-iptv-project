export type AppEnvironment = 'development' | 'production';

const runtime = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string; EXPO_PUBLIC_APP_ENV?: string } } };
const configuredEnv = runtime.process?.env?.EXPO_PUBLIC_APP_ENV ?? runtime.process?.env?.NODE_ENV;
const isProduction = configuredEnv === 'production';

export const appConfig = {
  environment: (isProduction ? 'production' : 'development') as AppEnvironment,
  isProduction,
  asyncTimeoutMs: 15_000,
  enableDebugLogs: !isProduction,
  enablePerformanceLogs: true,
};
