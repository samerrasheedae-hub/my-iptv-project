import { createNetworkLayer, NetworkRepository } from '@/network';
import { DeviceStore } from '@/monetization/storage/DeviceStore';
import { AsyncStorageSessionStore, SessionStore } from '@/monetization/storage/SessionStore';
import { SessionAuthProvider } from '@/monetization/services/SessionAuthProvider';
import { BackendUserService, UserService } from '@/monetization/services/UserService';
import { BackendSubscriptionService, SubscriptionService } from '@/monetization/services/SubscriptionService';
import { RepositoryBackedUserRepository, UserRepository } from '@/monetization/repositories/UserRepository';
import { RepositoryBackedSubscriptionRepository, SubscriptionRepository } from '@/monetization/repositories/SubscriptionRepository';
import { AccessControlRepository, BackendAccessControlRepository } from '@/monetization/access/AccessControlRepository';

export interface MonetizationSystem {
  sessionStore: SessionStore;
  deviceStore: DeviceStore;
  userService: UserService;
  subscriptionService: SubscriptionService;
  userRepository: UserRepository;
  subscriptionRepository: SubscriptionRepository;
  accessControlRepository: AccessControlRepository;
}

export interface MonetizationSystemOptions {
  networkRepository?: NetworkRepository;
  sessionStore?: SessionStore;
}

export function createMonetizationSystem(options: MonetizationSystemOptions = {}): MonetizationSystem {
  const sessionStore = options.sessionStore ?? new AsyncStorageSessionStore();
  const deviceStore = new DeviceStore();
  const networkRepository = options.networkRepository ?? createNetworkLayer({
    authProvider: new SessionAuthProvider(sessionStore),
    baseUrl: 'https://backend-placeholder.local',
    rateLimit: { maxRequests: 8, perMilliseconds: 1000 },
  }).networkRepository;

  const userService = new BackendUserService(networkRepository);
  const subscriptionService = new BackendSubscriptionService(networkRepository);
  const userRepository = new RepositoryBackedUserRepository(userService, sessionStore, deviceStore);
  const subscriptionRepository = new RepositoryBackedSubscriptionRepository(subscriptionService, sessionStore);
  const accessControlRepository = new BackendAccessControlRepository(subscriptionRepository);

  return {
    sessionStore,
    deviceStore,
    userService,
    subscriptionService,
    userRepository,
    subscriptionRepository,
    accessControlRepository,
  };
}
