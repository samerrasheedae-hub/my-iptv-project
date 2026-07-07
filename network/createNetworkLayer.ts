import { ApiClient } from './ApiClient';
import { ErrorMapper } from './ErrorMapper';
import { MockHttpTransport } from './MockHttpTransport';
import { NetworkManager, ManualConnectivityProvider } from './NetworkManager';
import { ApiNetworkRepository, NetworkRepository } from './NetworkRepository';
import { RequestQueue } from './RequestQueue';
import { MockAuthProvider } from './auth';
import { appConfig } from '@/config/env';
import { AppLogger } from '@/stability/AppLogger';
import { ConsoleNetworkLogger, NoopNetworkLogger } from './logger';
import { AuthProvider, ConnectivityProvider, HttpTransport, NetworkLogger, RateLimitPolicy } from './types';

export interface NetworkLayer {
  apiClient: ApiClient;
  networkManager: NetworkManager;
  requestQueue: RequestQueue;
  errorMapper: ErrorMapper;
  networkRepository: NetworkRepository;
  connectivityProvider: ConnectivityProvider;
}

export interface NetworkLayerOptions {
  baseUrl?: string;
  transport?: HttpTransport;
  authProvider?: AuthProvider;
  connectivityProvider?: ConnectivityProvider;
  logger?: NetworkLogger;
  enableConsoleLogging?: boolean;
  rateLimit?: RateLimitPolicy;
}

export function createNetworkLayer(options: NetworkLayerOptions = {}): NetworkLayer {
  const logger = options.logger ?? (options.enableConsoleLogging && !appConfig.isProduction ? new ConsoleNetworkLogger() : new NoopNetworkLogger());
  const connectivityProvider = options.connectivityProvider ?? new ManualConnectivityProvider();
  const networkManager = new NetworkManager(connectivityProvider, logger);
  void networkManager.initialize().catch((error) => AppLogger.warn('network_manager_initialize_failed', { error: String(error) }));

  const requestQueue = new RequestQueue(networkManager, {
    concurrency: 4,
    rateLimit: options.rateLimit ?? { maxRequests: 8, perMilliseconds: 1000 },
    logger,
  });
  const errorMapper = new ErrorMapper();
  const apiClient = new ApiClient({
    baseUrl: options.baseUrl ?? 'https://mock.local',
    transport: options.transport ?? new MockHttpTransport(),
    networkManager,
    requestQueue,
    errorMapper,
    authProvider: options.authProvider ?? new MockAuthProvider(),
    logger,
    requestInterceptors: [
      (request) => ({
        ...request,
        headers: {
          'x-client': 'premium-iptv-ui',
          'x-request-source': request.background ? 'background' : 'foreground',
          ...(request.headers ?? {}),
        },
      }),
    ],
    responseInterceptors: [
      (response) => ({
        ...response,
        headers: {
          ...response.headers,
          'x-client-received-at': new Date().toISOString(),
        },
      }),
    ],
  });

  return {
    apiClient,
    networkManager,
    requestQueue,
    errorMapper,
    networkRepository: new ApiNetworkRepository(apiClient, networkManager, requestQueue),
    connectivityProvider,
  };
}
