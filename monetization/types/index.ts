export type AuthProviderKind = 'local' | 'backend' | 'apple' | 'google' | 'email';
export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'grace_period' | 'expired' | 'cancelled' | 'past_due';
export type PaymentProviderKind = 'stripe' | 'apple_iap' | 'google_play' | 'manual' | 'none';
export type DevicePlatform = 'ios' | 'android' | 'web' | 'unknown';

export type FeatureKey =
  | 'xtream_account_connect'
  | 'm3u_source_connect'
  | 'unified_search'
  | 'background_sync'
  | 'high_volume_category_loading'
  | 'downloads'
  | 'multi_device'
  | 'premium_player_controls';

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  authProvider: AuthProviderKind;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  tokens: AuthTokens;
  deviceId: string;
  createdAt: string;
  lastValidatedAt?: string;
}

export interface DeviceInfo {
  id: string;
  userId?: string;
  platform: DevicePlatform;
  name?: string;
  appVersion?: string;
  pushToken?: string;
  lastSeenAt: string;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
  device: DeviceInfo;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
  device: DeviceInfo;
}

export interface AuthResult {
  profile: UserProfile;
  session: UserSession;
  subscription: SubscriptionSnapshot;
}

export interface SubscriptionSnapshot {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: PaymentProviderKind;
  entitlementIds: string[];
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  gracePeriodEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
  updatedAt: string;
}

export interface FeatureAccessRequest {
  userId: string;
  feature: FeatureKey;
  deviceId: string;
  playlistId?: string;
  providerKind?: 'xtream' | 'm3u' | 'unified';
  estimatedLoad?: number;
}

export interface FeatureAccessDecision {
  feature: FeatureKey;
  allowed: boolean;
  tier: SubscriptionTier;
  reason?: string;
  upgradeRequired?: boolean;
  checkedAt: string;
  expiresAt?: string;
}

export interface UpgradeIntent {
  id: string;
  userId: string;
  provider: PaymentProviderKind;
  targetTier: SubscriptionTier;
  clientSecret?: string;
  checkoutUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface BackendEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  requestId?: string;
}
