# Monetization and User Management System

This module is additive. It does not modify UI design, Xtream, M3U, Unified Media, player, or existing repository architecture.

## Architecture

```text
Future UI / app flows
 ↓
UserRepository / SubscriptionRepository / AccessControlRepository
 ↓
UserService / SubscriptionService
 ↓
NetworkRepository
 ↓
Backend API
```

The backend is the source of truth for login, session validation, subscription state, feature access, device registration, and upgrade/payment intent creation.

## Implemented files

```text
monetization/types/index.ts
monetization/storage/SessionStore.ts
monetization/storage/DeviceStore.ts
monetization/services/UserService.ts
monetization/services/SubscriptionService.ts
monetization/services/SessionAuthProvider.ts
monetization/repositories/UserRepository.ts
monetization/repositories/SubscriptionRepository.ts
monetization/access/AccessControlRepository.ts
monetization/payments/PaymentProvider.ts
monetization/createMonetizationSystem.ts
monetization/index.ts
```

## User system

Supports:

- Register
- Login
- Logout
- Session persistence
- Session validation
- Device registration
- Multi-device architecture

Local storage is used for profile/session/subscription/device state for UX continuity only. Backend validation remains authoritative.

## Subscription system

Supports:

- Free vs Premium tiers
- Subscription status
- Expiration
- Grace period
- Past due/cancelled/expired states
- Entitlements
- Future payment provider references

## Access control

Feature access goes through `AccessControlRepository`, which calls backend-side subscription checks via `SubscriptionService`.

The frontend does not hardcode premium access decisions.

## Secure design

- Token-based authentication via `SessionAuthProvider`.
- No hardcoded premium flags.
- Session validation is backend-driven.
- Device identity is persisted for multi-device architecture.

## Payment provider scalability

The system includes a `PaymentProvider` abstraction and upgrade intents so Stripe, Apple IAP, Google Play, and manual/admin billing can be added later.

## No engine changes

This module does not alter Xtream, M3U, or Unified Media engines. Future integrations can call `AccessControlRepository.canAccess()` before high-load operations without changing provider architecture.
