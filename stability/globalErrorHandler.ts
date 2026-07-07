import { AppLogger } from './AppLogger';

let installed = false;

export function installGlobalErrorHandler() {
  if (installed) return;
  installed = true;

  const globalErrorUtils = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
      setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
    };
    addEventListener?: (type: string, listener: (event: { reason?: unknown }) => void) => void;
  };

  const previousHandler = globalErrorUtils.ErrorUtils?.getGlobalHandler?.();
  globalErrorUtils.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    AppLogger.error('global_error', { message: error.message, stack: error.stack, isFatal });
    previousHandler?.(error, isFatal);
  });

  globalErrorUtils.addEventListener?.('unhandledrejection', (event) => {
    AppLogger.error('unhandled_promise_rejection', { reason: String(event.reason) });
  });
}
