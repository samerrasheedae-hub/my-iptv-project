import { AuthResult, DeviceInfo, LoginInput, RegisterInput, UserProfile, UserSession } from '@/monetization/types';
import { DeviceStore } from '@/monetization/storage/DeviceStore';
import { SessionStore, StoredUserState } from '@/monetization/storage/SessionStore';
import { UserService } from '@/monetization/services/UserService';
import { AppLogger } from '@/stability/AppLogger';

export interface UserRepository {
  getStoredState(): Promise<StoredUserState>;
  getCurrentSession(): Promise<UserSession | undefined>;
  getCurrentProfile(): Promise<UserProfile | undefined>;
  getDevice(): Promise<DeviceInfo>;
  register(input: Omit<RegisterInput, 'device'>): Promise<AuthResult>;
  login(input: Omit<LoginInput, 'device'>): Promise<AuthResult>;
  logout(): Promise<void>;
  validateSession(): Promise<AuthResult | undefined>;
}

export class RepositoryBackedUserRepository implements UserRepository {
  constructor(
    private readonly service: UserService,
    private readonly sessionStore: SessionStore,
    private readonly deviceStore: DeviceStore,
  ) {}

  getStoredState() {
    return this.sessionStore.getState();
  }

  async getCurrentSession() {
    return (await this.sessionStore.getState()).session;
  }

  async getCurrentProfile() {
    return (await this.sessionStore.getState()).profile;
  }

  getDevice() {
    return this.deviceStore.getOrCreateDevice();
  }

  async register(input: Omit<RegisterInput, 'device'>): Promise<AuthResult> {
    const device = await this.getDevice();
    const result = await this.service.register({ ...input, device });
    await this.persistAuthResult(result, device);
    return result;
  }

  async login(input: Omit<LoginInput, 'device'>): Promise<AuthResult> {
    const device = await this.getDevice();
    const result = await this.service.login({ ...input, device });
    await this.persistAuthResult(result, device);
    return result;
  }

  async logout(): Promise<void> {
    const state = await this.sessionStore.getState();
    if (state.session) {
      await this.service.logout(state.session.id).catch((error) => AppLogger.warn('logout_backend_failed', { error: String(error) }));
    }
    await this.sessionStore.clear();
  }

  async validateSession(): Promise<AuthResult | undefined> {
    const state = await this.sessionStore.getState();
    if (!state.session) return undefined;
    try {
      const result = await this.service.validateSession(state.session);
      await this.persistAuthResult(result, state.device);
      return result;
    } catch (error) {
      AppLogger.warn('session_validation_failed', { error: String(error) });
      return undefined;
    }
  }

  private async persistAuthResult(result: AuthResult, device?: DeviceInfo) {
    await this.sessionStore.patchState({
      profile: result.profile,
      session: result.session,
      subscription: result.subscription,
      device,
    });
  }
}
