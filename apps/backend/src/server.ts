// Load environment variables from .env file
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { Server } from 'http';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from '@project/trpc';
import { paymentMiddleware } from 'x402-express';
import { streamHandler } from './components/stream/stream';
import { initializeAmbientAudioCache } from './components/stream/components/buildEpisode/components/ambientAudioCache';
import { getConfig } from './getConfig';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

// Store server instance for cleanup on reload
let server: Server | null = null;

const config = getConfig({
  ffmpegPath: process.env.FFMPEG_PATH,
  ffprobePath: process.env.FFPROBE_PATH,
  receivingWallet: process.env.RECEIVING_WALLET,
  environment:
    process.env.ENVIRONMENT === 'development' ? 'development' : 'production',
});

function createServer() {
  const app = express();

  // Enable CORS
  app.use(cors());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.use(
    paymentMiddleware(
      config.receivingWallet,
      {
        'GET /stream': {
          price: '$0.01',
          network: 'base-sepolia',
          config: {
            description: 'Get a custom meditation podcast file',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description:
                    'The meditation prompt or topic. Describes what kind of meditation you want (e.g., "gratitude", "mindfulness", "sleep", "anxiety relief"). If not provided, defaults to a general gratitude meditation.',
                },
                voice: {
                  type: 'string',
                  enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
                  description:
                    'The voice to use for narration. Valid values: "alloy", "echo", "fable", "onyx", "nova", "shimmer". If not provided or invalid, a random voice will be selected.',
                },
                ambience: {
                  type: 'string',
                  description:
                    'The ambient background audio track number (1-13). Each number corresponds to a different ambient soundscape. If not provided or invalid, a random ambient track will be selected.',
                  pattern: '^([1-9]|1[0-3])$',
                },
              },
            },
            outputSchema: null,
          },
        },
      },
      config.environment === 'production' ? config.facilitator : undefined,
    ),
  );

  // Stream audio endpoint
  app.get(
    '/stream',
    streamHandler(config, config.environment === 'production' ? 200 : 30),
  );
  app.get('/demo', streamHandler(config, 30));

  // tRPC endpoint
  app.use(
    '/api',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}

// Cleanup function for tsx watch
function cleanup() {
  if (server) {
    logger.info('Closing server...', { component: 'server' });
    server.close(() => {
      logger.info('Server closed', { component: 'server' });
      server = null;
    });
  }
}

// Handle cleanup on process termination
if (!process.listenerCount('SIGTERM')) {
  process.on('SIGTERM', cleanup);
}
if (!process.listenerCount('SIGINT')) {
  process.on('SIGINT', cleanup);
}

// Cleanup on module reload (tsx watch kills the process, but good to be safe)
declare global {
  var __server__: Server | null | undefined;
}

// Close existing server if module is reloaded
if (global.__server__) {
  global.__server__.close(() => {
    global.__server__ = undefined;
    start();
  });
} else {
  start();
}

async function start() {
  // Initialize ambient audio cache before starting server
  logger.info('Initializing ambient audio cache...', {
    component: 'server',
  });
  try {
    await initializeAmbientAudioCache(config);
    logger.info('Ambient audio cache ready', { component: 'server' });
  } catch (error) {
    logger.error('Failed to initialize ambient audio cache', error, {
      component: 'server',
    });
    logger.warn('Ambient audio will be loaded from disk on demand', {
      component: 'server',
    });
  }

  // Create and start server
  const app = createServer();
  server = app.listen(PORT, () => {
    logger.info('Backend server started', {
      component: 'server',
      port: PORT,
      endpoints: {
        trpc: `http://localhost:${PORT}/api`,
        stream: `http://localhost:${PORT}/stream`,
        demo: `http://localhost:${PORT}/demo`,
      },
    });
  });

  // Store in global for cleanup on reload
  global.__server__ = server;

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`, err, {
        component: 'server',
      });
      process.exit(1);
    } else {
      logger.error('Server error', err, { component: 'server' });
      process.exit(1);
    }
  });
}
