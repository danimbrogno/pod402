import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const stripXfoAndSetCsp = {
  name: 'strip-xfo-and-set-csp',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Intercept writeHead to catch headers set later in the pipeline
      const writeHead = res.writeHead;
      res.writeHead = function (statusCode: any, reason?: any, headers?: any) {
        // Remove any X-Frame-Options set by other middleware
        res.removeHeader('X-Frame-Options');
        res.removeHeader('x-frame-options');
        if (headers) {
          delete headers['X-Frame-Options'];
          delete headers['x-frame-options'];
        }
        // Prefer CSP frame-ancestors (modern, spec-compliant)
        // Allow your dev origin (adjust as needed)
        res.setHeader(
          'Content-Security-Policy',
          "frame-ancestors 'self' http://localhost:5173 https://localhost:5173 *",
        );
        // Call the original writeHead
        return writeHead.call(this, statusCode, reason, headers);
      };
      next();
    });
  },
};

export default defineConfig(({ mode }) => {
  // Load env vars from .env file
  // This makes env vars available in server-side code (loaders, actions)
  // The third parameter '' means load all env files (.env, .env.local, .env.[mode], etc.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [stripXfoAndSetCsp, tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {
      port: 4000,
      host: 'localhost',
    },
    ssr: {
      // noExternal: ['@farcaster/miniapp-sdk'],
      external: ['eruda'], // Exclude from client bundle
      target: 'node',
    },
    env: {
      ...env,
    },
  } as any;
});
