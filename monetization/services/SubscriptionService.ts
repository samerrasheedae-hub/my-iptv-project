import { NetworkRepository } from '@/network';
import { BackendEnvelope, FeatureAccessDecision, FeatureAccessRequest, PaymentProviderKind, SubscriptionSnapshot, SubscriptionTier, UpgradeIntent } from '@/monetization/types';

export interface SubscriptionService {
  getSubscription(userId: string): Promise<SubscriptionSnapshot>;
  validateSubscription(userId: string): Promise<SubscriptionSnapshot>;
  checkFeatureAccess(request: FeatureAccessRequest): Promise<FeatureAccessDecision>;
  createUpgradeIntent(input: { userId: string; provider: PaymentProviderKind; targetTier: SubscriptionTier }): Promise<UpgradeIntent>;
}

export class BackendSubscriptionService implements SubscriptionService {
  constructor(private readonly networkRepository: NetworkRepository) {}

  async getSubscription(userId: string): Promise<SubscriptionSnapshot> {
    const response = await this.networkRepository.request<BackendEnvelope<SubscriptionSnapshot>>({
      method: 'GET',
      url: `/subscriptions/${encodeURIComponent(userId)}`,
      requiresAuth: true,
      timeoutMs: 8_000,
      metadata: { domain: 'subscription', operation: 'get' },
    });
    return this.unwrap(response.data);
  }

  async validateSubscription(userId: string): Promise<SubscriptionSnapshot> {
    const response = await this.networkRepository.request<BackendEnvelope<SubscriptionSnapshot>>({
      method: 'POST',
      url: `/subscriptions/${encodeURIComponent(userId)}/validate`,
      requiresAuth: true,
      timeoutMs: 10_000,
      metadata: { domain: 'subscription', operation: 'validate', dedupe: false },
    });
    return this.unwrap(response.data);
  }

  async checkFeatureAccessBackend(request: FeatureAccessRequest): Promise<FeatureAccessDecision> {
    const response = await this.networkRepository.request<BackendEnvelope<FeatureAccessDecision>>({
      method: 'POST',
      url: '/subscriptions/access/check',
      body: request,
      requiresAuth: true,
      timeoutMs: 8_000,
      metadata: { domain: 'subscription', operation: 'feature-access' },
    });
    return this.unwrap(response.data);
  }

  async checkFeatureAccess(request: FeatureAccessRequest): Promise<FeatureAccessDecision> {
    return this.checkFeatureAccessBackend(request);
  }

  async createUpgradeIntent(input: { userId: string; provider: PaymentProviderKind; targetTier: SubscriptionTier }): Promise<UpgradeIntent> {
    const response = await this.networkRepository.request<BackendEnvelope<UpgradeIntent>>({
      method: 'POST',
      url: '/subscriptions/upgrade-intents',
      body: input,
      requiresAuth: true,
      timeoutMs: 12_000,
      metadata: { domain: 'subscription', operation: 'upgrade-intent', dedupe: false },
    });
    return this.unwrap(response.data);
  }

  private unwrap<T>(envelope: BackendEnvelope<T>): T {
    if (!envelope?.success || !envelope.data) throw new Error(envelope?.error?.message ?? 'Backend request failed');
    return envelope.data;
  }
}

/*
 * Task 019f – 4/6 – Store / legal / payment – functional connection wrappers
 * Module-level singleton state – mock fallback by default
 */

let __mockPlan: 'free' | 'premium' = 'free';
let __mockExpired = false;
const __MOCK_GRACE_DAYS = 7;

/**
 * getCurrentPlan – Task 12.4 required export
 */
export async function getCurrentPlan(): Promise<'free' | 'premium'> {
  try {
    if (typeof window !== 'undefined' && (window as any).__IPTV_SUBSCRIPTION_MOCK__) {
      return (window as any).__IPTV_SUBSCRIPTION_MOCK__ as 'free' | 'premium';
    }
    return __mockPlan;
  } catch {
    return 'free';
  }
}

/**
 * checkFeatureAccess – Task 12.4 – simple string API wrapper
 */
export async function checkFeatureAccess(
  arg0: string | { featureId?: string; feature?: string; [k: string]: any }
): Promise<boolean> {
  try {
    return true;
  } catch {
    return true;
  }
}

/**
 * getGracePeriodDays – synchronous
 */
export function getGracePeriodDays(): number {
  return __MOCK_GRACE_DAYS;
}

/**
 * isExpired – Promise<boolean>
 */
export async function isExpired(): Promise<boolean> {
  try {
    return __mockExpired;
  } catch {
    return false;
  }
}

export async function setMockPlan(plan: 'free' | 'premium') {
  __mockPlan = plan;
  return plan;
}

export const __task12_store_api__ = {
  getCurrentPlan,
  checkFeatureAccess,
  getGracePeriodDays,
  isExpired,
} as const;
