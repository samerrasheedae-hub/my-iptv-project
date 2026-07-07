import { FeatureAccessDecision, FeatureAccessRequest, PaymentProviderKind, SubscriptionSnapshot, SubscriptionTier, UpgradeIntent } from '@/monetization/types';
import { SessionStore } from '@/monetization/storage/SessionStore';
import { SubscriptionService } from '@/monetization/services/SubscriptionService';
import { AppLogger } from '@/stability/AppLogger';

export interface SubscriptionRepository {
  getCachedSubscription(): Promise<SubscriptionSnapshot | undefined>;
  refreshSubscription(userId: string): Promise<SubscriptionSnapshot | undefined>;
  validateSubscription(userId: string): Promise<SubscriptionSnapshot | undefined>;
  checkFeatureAccess(request: FeatureAccessRequest): Promise<FeatureAccessDecision>;
  createUpgradeIntent(input: { userId: string; provider: PaymentProviderKind; targetTier: SubscriptionTier }): Promise<UpgradeIntent>;
}

export class RepositoryBackedSubscriptionRepository implements SubscriptionRepository {
  constructor(
    private readonly service: SubscriptionService,
    private readonly sessionStore: SessionStore,
  ) {}

  async getCachedSubscription(): Promise<SubscriptionSnapshot | undefined> {
    return (await this.sessionStore.getState()).subscription;
  }

  async refreshSubscription(userId: string): Promise<SubscriptionSnapshot | undefined> {
    try {
      const subscription = await this.service.getSubscription(userId);
      await this.sessionStore.patchState({ subscription });
      return subscription;
    } catch (error) {
      AppLogger.warn('subscription_refresh_failed', { error: String(error) });
      return this.getCachedSubscription();
    }
  }

  async validateSubscription(userId: string): Promise<SubscriptionSnapshot | undefined> {
    try {
      const subscription = await this.service.validateSubscription(userId);
      await this.sessionStore.patchState({ subscription });
      return subscription;
    } catch (error) {
      AppLogger.warn('subscription_validation_failed', { error: String(error) });
      return this.getCachedSubscription();
    }
  }

  checkFeatureAccess(request: FeatureAccessRequest): Promise<FeatureAccessDecision> {
    return this.service.checkFeatureAccess(request);
  }

  createUpgradeIntent(input: { userId: string; provider: PaymentProviderKind; targetTier: SubscriptionTier }): Promise<UpgradeIntent> {
    return this.service.createUpgradeIntent(input);
  }
}
