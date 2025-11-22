import { RequestHandler } from 'express';
import { createReadStream, statSync, existsSync, ReadStream } from 'fs';
import { join } from 'path';
import { buildEpisode } from './components/buildEpisode/buildEpisode';
import { Config } from '../../interface';
import { getAssetsDir } from '../../utils/getAssetsDir';

// Resolve assets directory using utility function
const ASSETS_DIR = getAssetsDir();

export const streamHandler =
  (config: Config): RequestHandler =>
  async (request, response) => {
    const requestId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    console.log(`[streamHandler] Request ${requestId} started`);

    let episodeResources: {
      cleanup?: () => void;
      transcoder?: any;
      audioContext?: AudioContext;
    } | null = null;

    try {
      const episode = await buildEpisode(
        config,
        request.query.prompt as string
      );
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

      episode.transcoder
        .pipe(response, { end: true })
        .on('close', () => {
          console.log(
            `[streamHandler] Request ${requestId} - Transcoder pipe closed`
          );
        })
        .on('error', (error: Error) => {
          // Handle pipe errors gracefully
          const isExpectedDisconnect =
            error.message === 'Output stream closed' ||
            error.message.includes('stream closed') ||
            error.message.includes('EPIPE') ||
            error.message.includes('ECONNRESET');

          if (!isExpectedDisconnect) {
            console.error(
              `[streamHandler] Request ${requestId} - Pipe error:`,
              error
            );
          }
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
        // Unpipe the transcoder from the response to prevent further writes
        if (episodeResources?.transcoder) {
          try {
            episodeResources.transcoder.unpipe(response);
          } catch (error) {
            // Ignore errors when unpiping already closed stream
          }
        }
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
        // "Output stream closed" is expected when client disconnects
        const isExpectedDisconnect =
          error.message === 'Output stream closed' ||
          error.message.includes('stream closed') ||
          error.message.includes('EPIPE') ||
          error.message.includes('ECONNRESET');

        if (isExpectedDisconnect) {
          console.log(
            `[streamHandler] Request ${requestId} - Client disconnected, transcoder stream closed (expected)`
          );
          // Trigger cleanup on expected disconnect
          if (episodeResources?.cleanup) {
            episodeResources.cleanup();
          }
        } else {
          console.error(
            `[streamHandler] Request ${requestId} - Transcoder error:`,
            error
          );
        }
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
