import { PaymentProviderKind, SubscriptionTier, UpgradeIntent } from '@/monetization/types';

export interface PaymentProvider {
  readonly kind: PaymentProviderKind;
  createUpgradeIntent(input: { userId: string; targetTier: SubscriptionTier }): Promise<UpgradeIntent>;
  restorePurchases?(userId: string): Promise<void>;
}
