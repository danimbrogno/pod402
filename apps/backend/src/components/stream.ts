import { RequestHandler } from 'express';
import { createReadStream, statSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve assets directory - works in both dev and production
// In dev: __dirname = apps/backend/src, so join(__dirname, '../assets/background') works
// In production: adjust path as needed
let ASSETS_DIR = join(__dirname, '../../assets/background');

// If assets don't exist in relative path (production build), try absolute from project root
if (!existsSync(ASSETS_DIR)) {
  // In production, the file is in dist/apps/backend, so go up to workspace root
  ASSETS_DIR = join(__dirname, '../../../../../apps/backend/assets/background');
}

export const streamHandler: RequestHandler = async (req, res) => {
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
};
