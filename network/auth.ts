import { AuthProvider } from './types';

export class MockAuthProvider implements AuthProvider {
  constructor(private token = 'mock-development-token') {}

  async getAuthHeaders(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${this.token}` };
  }

  async refreshAuth(): Promise<void> {
    this.token = `mock-development-token-${Date.now()}`;
  }
}
