import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  url.protocol = 'https';
  const origin = url.origin;

  // Get environment variables (available on server-side)
  // In client-side, these will be undefined, so we'll use defaults
  const getEnvVar = (key: string, defaultValue: string) => {
    if (typeof process !== 'undefined' && process.env[key]) {
      return process.env[key];
    }
    return defaultValue;
  };

  return {
    origin,
    appName: getEnvVar('FARCASTER_APP_NAME', 'Zen Den'),
    iconUrl: getEnvVar('FARCASTER_ICON_URL', `${origin}/favicon.ico`),
    homeUrl: getEnvVar('FARCASTER_HOME_URL', origin),
    splashImageUrl: getEnvVar(
      'FARCASTER_SPLASH_IMAGE_URL',
      `${origin}/splash.png`,
    ),
    splashBackgroundColor: getEnvVar('FARCASTER_SPLASH_BG_COLOR', '#ffffff'),
  };
}

export function meta({ data }: Route.MetaArgs) {
  // Get values from loader data (which handles env vars on server-side)
  const origin = data?.origin || 'https://localhost:4000';
  const appName = data?.appName || 'Zen Den';
  const iconUrl = data?.iconUrl || `${origin}/favicon.ico`;
  const homeUrl = data?.homeUrl || origin;
  const splashImageUrl = data?.splashImageUrl || `${origin}/splash.png`;
  const splashBackgroundColor = data?.splashBackgroundColor || '#ffffff';

  return [
    { title: appName },
    {
      name: 'description',
      content: 'Welcome to Zen Den - your peaceful meditation space.',
    },
    {
      property: 'fc:miniapp',
      content: JSON.stringify({
        version: 'vNext',
        image: iconUrl,
        button: {
          action: 'open',
          target: homeUrl,
        },
        splashImageUrl,
        splashBackgroundColor,
      }),
    },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (error && error instanceof Error) {
    details = error.message;
    // Only show stack in development
    // Check process.env if available (server-side), or use import.meta.env.DEV (client-side with Vite)
    const isDev =
      (typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development') ||
      (typeof import.meta !== 'undefined' &&
        (import.meta as any).env?.DEV === true);
    if (isDev) {
      stack = error.stack;
    }
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
