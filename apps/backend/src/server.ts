// Load environment variables from .env file
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { Server } from 'http';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from '@project/trpc';
import { paymentMiddleware, Network } from 'x402-express';
import { streamHandler } from './components/stream/stream';
import { initializeAmbientAudioCache } from './components/stream/components/buildEpisode/components/ambientAudioCache';
import { getConfig } from './getConfig';

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

  const environment = process.env.ENVIRONMENT || 'development';

  // Enable CORS
  app.use(cors());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.use(
    paymentMiddleware(
      config.receivingWallet, // your receiving wallet address
      {
        // Route configurations for protected endpoints
        'GET /stream': {
          // USDC amount in dollars
          price: '$0.01',
          network: 'base-sepolia', // for mainnet, see Running on Mainnet section
          // Optional: Add metadata for better discovery in x402 Bazaar
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
      config.environment === 'production' ? config.facilitator : undefined
      // TODO: implement facilitator for production
    )
  );

  // Stream audio endpoint
  app.get('/stream', streamHandler(config));
  app.get('/demo', streamHandler(config));

  // tRPC endpoint
  app.use(
    '/api',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

// Cleanup function for tsx watch
function cleanup() {
  if (server) {
    console.log('🛑 Closing server...');
    server.close(() => {
      console.log('✅ Server closed');
      server = null;
    });
  }
}

// Handle cleanup on process termination
// Note: Only register listeners once (tsx watch restarts the module)
if (!process.listenerCount('SIGTERM')) {
  process.on('SIGTERM', cleanup);
}
if (!process.listenerCount('SIGINT')) {
  process.on('SIGINT', cleanup);
}

// Cleanup on module reload (tsx watch kills the process, but good to be safe)
// Store reference in global to persist across reloads
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
  console.log('🔄 Initializing ambient audio cache...');
  try {
    await initializeAmbientAudioCache(config);
    console.log('✅ Ambient audio cache ready');
  } catch (error) {
    console.error('⚠️ Failed to initialize ambient audio cache:', error);
    console.log('⚠️ Ambient audio will be loaded from disk on demand');
  }

  // Create and start server
  const app = createServer();
  server = app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/api`);
    console.log(`🎵 Stream endpoint: http://localhost:${PORT}/stream`);
    console.log('LFG!');
  });

  // Store in global for cleanup on reload
  global.__server__ = server;

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${PORT} is already in use. Please stop the other server.`
      );
      process.exit(1);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}
