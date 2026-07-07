import { ConnectivityProvider, NetworkLogger } from './types';
import { NoopNetworkLogger } from './logger';

type Listener = (online: boolean) => void;
type RecoveryListener = () => void | Promise<void>;

export class ManualConnectivityProvider implements ConnectivityProvider {
  private online = true;
  private listeners = new Set<Listener>();

  async isOnline() {
    return this.online;
  }

  setOnline(online: boolean) {
    if (this.online === online) return;
    this.online = online;
    this.listeners.forEach((listener) => listener(online));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.online);
    return () => this.listeners.delete(listener);
  }
}

export class NetworkManager {
  private online = true;
  private listeners = new Set<Listener>();
  private recoveryListeners = new Set<RecoveryListener>();
  private unsubscribeConnectivity?: () => void;

  constructor(
    private readonly connectivityProvider: ConnectivityProvider = new ManualConnectivityProvider(),
    private readonly logger: NetworkLogger = new NoopNetworkLogger(),
  ) {}

  async initialize() {
    this.online = await this.connectivityProvider.isOnline();
    this.unsubscribeConnectivity = this.connectivityProvider.subscribe((online) => this.setOnline(online));
  }

  destroy() {
    this.unsubscribeConnectivity?.();
    this.listeners.clear();
    this.recoveryListeners.clear();
  }

  isOnline() {
    return this.online;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.online);
    return () => this.listeners.delete(listener);
  }

  onRecovery(listener: RecoveryListener) {
    this.recoveryListeners.add(listener);
    return () => this.recoveryListeners.delete(listener);
  }

  setOnline(online: boolean) {
    const wasOffline = !this.online;
    this.online = online;
    this.logger.info(online ? 'Network online' : 'Network offline');
    this.listeners.forEach((listener) => listener(online));

    if (online && wasOffline) {
      this.recoveryListeners.forEach((listener) => {
        Promise.resolve(listener()).catch((error) => this.logger.error('Recovery listener failed', { error }));
      });
    }
  }
}
