import { NetworkRepository } from '@/network';
import { AuthResult, BackendEnvelope, DeviceInfo, LoginInput, RegisterInput, UserProfile, UserSession } from '@/monetization/types';

export interface UserService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  logout(sessionId: string): Promise<void>;
  validateSession(session: UserSession): Promise<AuthResult>;
  refreshSession(session: UserSession): Promise<UserSession>;
  registerDevice(device: DeviceInfo, session?: UserSession): Promise<DeviceInfo>;
  getProfile(session: UserSession): Promise<UserProfile>;
}

export class BackendUserService implements UserService {
  constructor(private readonly networkRepository: NetworkRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const response = await this.networkRepository.request<BackendEnvelope<AuthResult>>({
      method: 'POST',
      url: '/users/register',
      body: input,
      timeoutMs: 12_000,
      metadata: { domain: 'user', operation: 'register', dedupe: false },
    });
    return this.unwrap(response.data);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const response = await this.networkRepository.request<BackendEnvelope<AuthResult>>({
      method: 'POST',
      url: '/users/login',
      body: input,
      timeoutMs: 12_000,
      metadata: { domain: 'user', operation: 'login', dedupe: false },
    });
    return this.unwrap(response.data);
  }

  async logout(sessionId: string): Promise<void> {
    await this.networkRepository.request<BackendEnvelope<{ ok: boolean }>>({
      method: 'POST',
      url: '/users/logout',
      body: { sessionId },
      requiresAuth: true,
      timeoutMs: 8_000,
      metadata: { domain: 'user', operation: 'logout', dedupe: false },
    });
  }

  async validateSession(session: UserSession): Promise<AuthResult> {
    const response = await this.networkRepository.request<BackendEnvelope<AuthResult>>({
      method: 'POST',
      url: '/users/session/validate',
      body: { sessionId: session.id, deviceId: session.deviceId },
      requiresAuth: true,
      timeoutMs: 10_000,
      metadata: { domain: 'user', operation: 'validate-session' },
    });
    return this.unwrap(response.data);
  }

  async refreshSession(session: UserSession): Promise<UserSession> {
    const response = await this.networkRepository.request<BackendEnvelope<UserSession>>({
      method: 'POST',
      url: '/users/session/refresh',
      body: { sessionId: session.id, refreshToken: session.tokens.refreshToken },
      timeoutMs: 10_000,
      metadata: { domain: 'user', operation: 'refresh-session', dedupe: false },
    });
    return this.unwrap(response.data);
  }

  async registerDevice(device: DeviceInfo, session?: UserSession): Promise<DeviceInfo> {
    const response = await this.networkRepository.request<BackendEnvelope<DeviceInfo>>({
      method: 'POST',
      url: '/users/devices',
      body: { device, sessionId: session?.id },
      requiresAuth: Boolean(session),
      timeoutMs: 8_000,
      metadata: { domain: 'user', operation: 'register-device', dedupe: false },
    });
    return this.unwrap(response.data);
  }

  async getProfile(session: UserSession): Promise<UserProfile> {
    const response = await this.networkRepository.request<BackendEnvelope<UserProfile>>({
      method: 'GET',
      url: '/users/me',
      requiresAuth: true,
      timeoutMs: 8_000,
      metadata: { domain: 'user', operation: 'profile' },
    });
    return this.unwrap(response.data);
  }

  private unwrap<T>(envelope: BackendEnvelope<T>): T {
    if (!envelope?.success || !envelope.data) throw new Error(envelope?.error?.message ?? 'Backend request failed');
    return envelope.data;
  }
}
