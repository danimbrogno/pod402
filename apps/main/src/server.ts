import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
const distPath = join(__dirname, '../../dist/apps/main');

// Middleware to set headers for Farcaster Mini App frame embedding
app.use((req, res, next) => {
  // Allow the app to be embedded in frames (required for Farcaster Mini Apps)
  // Set Content-Security-Policy to allow framing from any origin
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors *;"
  );
  
  // Ensure X-Frame-Options doesn't block embedding (CSP takes precedence)
  // Note: We don't set X-Frame-Options, relying on CSP instead
  
  // Set other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Serve static files
app.use(express.static(distPath, {
  // Set cache control for HTML files
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  },
}));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  try {
    const indexPath = join(distPath, 'index.html');
    const html = readFileSync(indexPath, 'utf-8');
    res.send(html);
  } catch (error) {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
