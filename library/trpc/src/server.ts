import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter, createContext } from './index';

/**
 * Create and configure tRPC HTTP server
 * @param port - Port to listen on (default: 3000)
 * @returns HTTP server instance
 */
export function createServer(port: number = 3000) {
  const server = createHTTPServer({
    router: appRouter,
    createContext,
  });
  // @ts-expect-error - createHTTPServer returns a server-like object with listen method
  const httpServer = server.listen(port, () => {
    console.log(`tRPC server listening on http://localhost:${port}`);
  });
  return httpServer;
}

/**
 * Example usage in apps/subgraph:
 *
 * import { createServer } from '@project/trpc/server';
 *
 * const server = createServer(3000);
 */
