import { AuthProvider } from '@/network';
import { SessionStore } from '@/monetization/storage/SessionStore';

export class SessionAuthProvider implements AuthProvider {
  constructor(private readonly store: SessionStore) {}

  async getAuthHeaders(): Promise<Record<string, string>> {
    const state = await this.store.getState();
    const token = state.session?.tokens.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
