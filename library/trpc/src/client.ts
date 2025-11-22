import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './index';

/**
 * Create a tRPC client
 * @param url - Server URL (default: http://localhost:3000)
 * @returns tRPC client proxy
 */
export function createClient(url: string = 'http://localhost:3000') {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
      }),
    ],
    transformer: undefined,
  });
}

/**
 * Example usage:
 *
 * import { createClient } from '@project/trpc/client';
 *
 * const client = createClient('http://localhost:3000');
 * const result = await client.health.query();
 * console.log(result);
 */
