import { FeatureAccessDecision, FeatureAccessRequest } from '@/monetization/types';
import { SubscriptionRepository } from '@/monetization/repositories/SubscriptionRepository';

export interface AccessControlRepository {
  canAccess(request: FeatureAccessRequest): Promise<FeatureAccessDecision>;
}

export class BackendAccessControlRepository implements AccessControlRepository {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  canAccess(request: FeatureAccessRequest): Promise<FeatureAccessDecision> {
    return this.subscriptionRepository.checkFeatureAccess(request);
  }
}
