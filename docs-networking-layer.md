# Production Networking Layer

The networking layer is provider-neutral and does not connect to Xtream, M3U, or IPTV streams. It currently uses mock endpoints through `MockHttpTransport`.

## Architecture

```text
Future repositories / provider adapters
  -> NetworkRepository
  -> ApiClient
  -> HttpTransport abstraction
  -> MockHttpTransport now, real transport later
```

Supporting services:

```text
NetworkManager
  - online/offline state
  - recovery events

RequestQueue
  - background request queue
  - offline queueing
  - concurrency control
  - rate limiting
  - automatic drain on network recovery

ErrorMapper
  - typed API errors
  - HTTP, network, timeout, cancelled, offline, rate-limited errors
```

## Implemented files

- `network/types.ts`
- `network/ApiClient.ts`
- `network/NetworkManager.ts`
- `network/RequestQueue.ts`
- `network/ErrorMapper.ts`
- `network/NetworkRepository.ts`
- `network/MockHttpTransport.ts`
- `network/RateLimiter.ts`
- `network/auth.ts`
- `network/logger.ts`
- `network/createNetworkLayer.ts`
- `network/index.ts`

## Features

- TypeScript-only implementation
- Clean Architecture boundaries
- Repository pattern via `NetworkRepository`
- HTTP client abstraction via `HttpTransport`
- Request interceptors
- Response interceptors
- Retry with exponential backoff
- Request timeout
- Request cancellation through `AbortController`
- Authentication header injection through `AuthProvider`
- Authentication refresh hook on `401`
- Logging abstraction
- Typed error handling
- Offline detection abstraction through `ConnectivityProvider`
- Background request queue
- Automatic queued request retry on network recovery
- Rate limiting
- Dependency injection through `createNetworkLayer`
- Unit-test friendly interfaces and mock transport

## Mock endpoints

Current mock routes are implemented inside `MockHttpTransport`:

- `/mock/ping`
- `/mock/auth`
- `/mock/error`
- `/mock/rate-limit`
- `/mock/timeout`

## Example usage

```ts
const network = createNetworkLayer();

const ping = await network.networkRepository.mockPing();

const controller = network.networkRepository.createCancellation();
const response = await network.networkRepository.request({
  method: 'GET',
  url: '/mock/ping',
  signal: controller.signal,
});

const background = network.networkRepository.backgroundRequest({
  method: 'GET',
  url: '/mock/ping',
  background: true,
  priority: 'low',
});
```

## Offline testing

The default connectivity provider is manual and test-friendly:

```ts
const layer = createNetworkLayer();
const provider = layer.connectivityProvider;

// If using ManualConnectivityProvider directly, tests can toggle online state
// and queued background requests will drain after recovery.
```

## IPTV status

No Xtream Codes API calls, M3U requests, playlist parsing, stream resolution, or IPTV networking has been implemented.
