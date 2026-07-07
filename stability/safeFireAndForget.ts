import { AppLogger } from './AppLogger';

export function safeFireAndForget(promise: Promise<unknown>, label: string) {
  promise.catch((error) => AppLogger.warn('fire_and_forget_failed', { label, error: String(error) }));
}
