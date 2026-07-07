import { ApiClient } from './ApiClient';
import { NetworkManager } from './NetworkManager';
import { RequestQueue } from './RequestQueue';
import { ApiRequestConfig, ApiResponse } from './types';

export interface NetworkHealth {
  online: boolean;
  queueSize: number;
  checkedAt: string;
}

export interface MockEndpointResult {
  ok: boolean;
  endpoint: string;
  method: string;
  receivedAt: string;
}

export interface NetworkRepository {
  getHealth(): Promise<NetworkHealth>;
  request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>>;
  backgroundRequest<T>(config: ApiRequestConfig): Promise<ApiResponse<T>>;
  createCancellation(): AbortController;
  mockPing(): Promise<MockEndpointResult>;
  mockAuthenticatedPing(): Promise<{ authorized: boolean }>;
}

export class ApiNetworkRepository implements NetworkRepository {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly networkManager: NetworkManager,
    private readonly requestQueue: RequestQueue,
  ) {}

  async getHealth(): Promise<NetworkHealth> {
    return {
      online: this.networkManager.isOnline(),
      queueSize: this.requestQueue.size(),
      checkedAt: new Date().toISOString(),
    };
  }

  request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.apiClient.request<T>(config);
  }

  backgroundRequest<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.apiClient.request<T>({ ...config, background: true });
  }

  createCancellation(): AbortController {
    return this.apiClient.cancelController();
  }

  async mockPing(): Promise<MockEndpointResult> {
    const response = await this.request<MockEndpointResult>({ method: 'GET', url: '/mock/ping', priority: 'high' });
    return response.data;
  }

  async mockAuthenticatedPing(): Promise<{ authorized: boolean }> {
    const response = await this.request<{ authorized: boolean }>({ method: 'GET', url: '/mock/auth', requiresAuth: true });
    return response.data;
  }
}
