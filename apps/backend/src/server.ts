import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from '@project/trpc';
import { paymentMiddleware, Network } from 'x402-express';
import { streamHandler } from './components/stream';
import { facilitator } from '@coinbase/x402'; // For mainnet

const app = express();
const PORT = process.env.PORT || 3000;

const environment = process.env.ENVIRONMENT || 'development';
const config = {
  environment,
  receivingWallet: process.env.RECEIVING_WALLET,
  facilitator:
    environment === 'production' ? facilitator : 'https://x402.org/facilitator',
};

console.log(process.env);

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
        price: '$0.001',
        network: 'base-sepolia', // for mainnet, see Running on Mainnet section
        // Optional: Add metadata for better discovery in x402 Bazaar
        config: {
          description: 'Get a custom meditation podcast file',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Prompt for the meditation',
              },
            },
          },
          outputSchema: null,
        },
      },
    },
    {
      url: facilitator,
    }
  )
);

// Stream audio endpoint
app.get('/stream', streamHandler);

// tRPC endpoint
app.use(
  '/api',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Start server with error handling for EADDRINUSE
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/api`);
  console.log(`🎵 Stream endpoint: http://localhost:${PORT}/stream`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error('❌ Server error:', err);
});
