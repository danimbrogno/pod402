// Load environment variables from .env file
import 'dotenv/config';

import type { EntryContext } from 'react-router';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  responseHeaders.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
  // TODO implement nonce/hash for inline scripts
  // https://stackoverflow.com/questions/55160698/how-to-use-react-without-unsafe-inline-javascript-css-code
  // Content-Security-Policy: Allow scripts from self, unsafe-inline (for React), and Cloudflare Insights
  // Also allow frame embedding from Farcaster domains
  responseHeaders.set(
    'Content-Security-Policy',
    `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; frame-ancestors 'self' https://farcaster.xyz https://*.farcaster.xyz https://wallet.farcaster.xyz;`,
  );

  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('Referrer-Policy', 'same-origin');
  responseHeaders.set('Permissions-Policy', 'fullscreen=(self)');

  // Set headers for Farcaster Mini App frame embedding
  // Allow embedding from Farcaster domains
  // responseHeaders.set(
  //   'Content-Security-Policy',
  //   "frame-ancestors 'self' https://farcaster.xyz https://*.farcaster.xyz https://wallet.farcaster.xyz;",
  // );
  // responseHeaders.set('X-Content-Type-Options', 'nosniff');
  // responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // // Allow cross-origin requests from Farcaster
  // responseHeaders.set('Access-Control-Allow-Origin', '*');
  // responseHeaders.set(
  //   'Access-Control-Allow-Methods',
  //   'GET, POST, OPTIONS, HEAD',
  // );
  // responseHeaders.set(
  //   'Access-Control-Allow-Headers',
  //   'Content-Type, Authorization',
  // );

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        // Log streaming rendering errors from inside the shell
        // Don't log errors related to aborting a request, as those are expected
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error(error);
        }
        responseStatusCode = 500;
      },
    },
  );

  // If the request is from a bot, wait for the stream to finish
  if (isbot(request.headers.get('user-agent') || '')) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
