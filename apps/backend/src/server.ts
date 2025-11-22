import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from '@project/trpc';
import { createReadStream, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve assets directory - works in both dev and production
// In dev: __dirname = apps/backend/src, so join(__dirname, '../assets/background') works
// In production: adjust path as needed
let ASSETS_DIR = join(__dirname, '../assets/background');

// If assets don't exist in relative path (production build), try absolute from project root
if (!existsSync(ASSETS_DIR)) {
  // In production, the file is in dist/apps/backend, so go up to workspace root
  ASSETS_DIR = join(__dirname, '../../../../apps/backend/assets/background');
}

// Enable CORS
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Stream audio endpoint
app.get('/stream', (req, res) => {
  // Get file number from query parameter, default to 001
  const fileNum = req.query.file || '001';
  const fileName = `${String(fileNum).padStart(3, '0')}.wav`;
  const filePath = join(ASSETS_DIR, fileName);

  try {
    // Check if file exists
    const stats = statSync(filePath);
    const fileSize = stats.size;

    // Parse range header for partial content support
    const range = req.headers.range;

    if (range) {
      // Parse range header (e.g., "bytes=0-1023")
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/wav',
      });

      // Create stream for the requested range
      const fileStream = createReadStream(filePath, { start, end });
      fileStream.pipe(res);
    } else {
      // Send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/wav',
        'Accept-Ranges': 'bytes',
      });

      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// tRPC endpoint
app.use(
  '/api',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Store server instance globally to handle vite-node reloads
declare global {
  var __server__: ReturnType<typeof app.listen> | undefined;
  var __shuttingDown__: boolean | undefined;
  var __startingServer__: boolean | undefined;
}

// Graceful shutdown handler
const shutdown = () => {
  if (global.__server__) {
    global.__shuttingDown__ = true;
    console.log('\n🛑 Shutting down server...');
    global.__server__.close(() => {
      console.log('✅ Server closed');
      global.__server__ = undefined;
      global.__shuttingDown__ = false;
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }
};

// Handle shutdown signals (only once)
if (!process.listenerCount('SIGTERM')) {
  process.on('SIGTERM', shutdown);
}
if (!process.listenerCount('SIGINT')) {
  process.on('SIGINT', shutdown);
}

// Close existing server if module is reloaded (vite-node)
if (global.__server__ && !global.__shuttingDown__) {
  console.log('🔄 Reloading server...');
  const oldServer = global.__server__;
  global.__server__ = undefined;

  oldServer.close(() => {
    // Wait a brief moment to ensure port is fully released
    setTimeout(() => {
      startServer();
    }, 100);
  });

  // Force close all connections if still open after a short delay
  setTimeout(() => {
    if (
      oldServer.listening &&
      typeof oldServer.closeAllConnections === 'function'
    ) {
      try {
        oldServer.closeAllConnections();
      } catch (err) {
        // Ignore errors when closing connections
      }
    }
  }, 1000);
} else {
  startServer();
}

function startServer() {
  // Prevent multiple simultaneous start attempts
  if (global.__startingServer__) {
    return;
  }

  global.__startingServer__ = true;

  // Start server with error handling for EADDRINUSE
  const server = app.listen(PORT, () => {
    global.__server__ = server;
    global.__startingServer__ = false;
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/api`);
    console.log(`🎵 Stream endpoint: http://localhost:${PORT}/stream`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    global.__startingServer__ = false;

    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${PORT} is still in use, retrying in 500ms...`);
      // Wait and retry
      setTimeout(() => {
        if (!global.__server__) {
          startServer();
        }
      }, 500);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}
