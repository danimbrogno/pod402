import { RequestHandler } from 'express';
import { createReadStream, statSync, existsSync, ReadStream } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { buildEpisode } from './components/buildEpisode/buildEpisode';
import { getEpisodeConfig } from './components/getEpisodeConfig';

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

export const streamHandler: RequestHandler = async (request, response) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[streamHandler] Request ${requestId} started`);

  const config = getEpisodeConfig({
    ffmpegPath: process.env.FFMPEG_PATH,
    ffprobePath: process.env.FFPROBE_PATH,
  });

  let episodeResources: {
    cleanup?: () => void;
    transcoder?: any;
    audioContext?: AudioContext;
  } | null = null;

  try {
    const episode = await buildEpisode(config, request.query.prompt as string);
    episodeResources = episode;
    console.log(
      `[streamHandler] Request ${requestId} - Episode build completed`
    );

    // Respond to the initial range request
    if (request.headers.range === 'bytes=0-1') {
      response.set('Content-Range', '*');
      response.set('Content-Type', 'audio/mp3');
      response.set('Keep-Alive', 'timeout=620, max=0');
      response.set('Accept-Ranges', 'none');
      return response.sendStatus(200).end();
    }
    response.set('Content-Range', '*');
    response.set('Content-Type', 'audio/mp3');
    response.set('Keep-Alive', 'timeout=620, max=0');
    response.set('Accept-Ranges', 'none');

    episode.transcoder.pipe(response, { end: true }).on('close', () => {
      console.log(
        `[streamHandler] Request ${requestId} - Transcoder pipe closed`
      );
    });

    // Handle client disconnect/abort
    request.on('close', () => {
      console.log(
        `[streamHandler] Request ${requestId} - Client connection closed`
      );
      if (episodeResources?.cleanup) {
        episodeResources.cleanup();
      }
    });

    request.on('aborted', () => {
      console.log(
        `[streamHandler] Request ${requestId} - Client request aborted`
      );
      if (episodeResources?.cleanup) {
        episodeResources.cleanup();
      }
    });

    response.on('close', () => {
      console.log(
        `[streamHandler] Request ${requestId} - Response stream closed`
      );
      if (episodeResources?.cleanup) {
        episodeResources.cleanup();
      }
    });

    response.on('finish', () => {
      console.log(
        `[streamHandler] Request ${requestId} - Response stream finished`
      );
    });

    episode.transcoder.on('error', (error: Error) => {
      console.error(
        `[streamHandler] Request ${requestId} - Transcoder error:`,
        error
      );
    });

    response.on('error', (error: Error) => {
      console.error(
        `[streamHandler] Request ${requestId} - Response error:`,
        error
      );
      if (episodeResources?.cleanup) {
        episodeResources.cleanup();
      }
    });
  } catch (error) {
    console.error(`[streamHandler] Request ${requestId} - Error:`, error);
    if (episodeResources?.cleanup) {
      episodeResources.cleanup();
    }
    if (!response.headersSent) {
      response.status(500).json({ error: 'Failed to build episode' });
    }
  }
};
