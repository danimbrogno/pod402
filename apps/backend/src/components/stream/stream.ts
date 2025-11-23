import { RequestHandler } from 'express';
import { buildEpisode } from './components/buildEpisode/buildEpisode';
import { Config } from '../../interface';
import { logger } from '../../utils/logger';

/**
 * Check if an error is an expected disconnect (client closed connection)
 */
function isExpectedDisconnect(error: Error): boolean {
  return (
    error.message === 'Output stream closed' ||
    error.message.includes('stream closed') ||
    error.message.includes('EPIPE') ||
    error.message.includes('ECONNRESET')
  );
}

export const streamHandler =
  (config: Config, length: number): RequestHandler =>
  async (request, response) => {
    const requestId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    logger.info(`Request started`, {
      component: 'streamHandler',
      requestId,
      prompt: request.query.prompt as string | undefined,
      voice: request.query.voice as string | undefined,
      ambience: request.query.ambience as string | undefined,
      length,
    });

    let episodeResources: {
      cleanup?: () => void;
      transcoder?: any;
      audioContext?: AudioContext;
      abortManager?: { abort: () => void };
    } | null = null;

    try {
      // Callback to close response when meditation completes
      const onMeditationComplete = () => {
        logger.info(`Meditation completed, closing response`, {
          component: 'streamHandler',
          requestId,
        });

        if (!response.writableEnded && !response.destroyed) {
          try {
            response.end();
          } catch (error) {
            // Response may already be closed, ignore error
            logger.debug(`Response already closed`, {
              component: 'streamHandler',
              requestId,
            });
          }
        }
      };

      const episode = await buildEpisode(
        config,
        length,
        onMeditationComplete,
        {
          prompt: request.query.prompt as string | undefined,
          voice: request.query.voice as string | undefined,
          ambience: request.query.ambience as string | undefined,
        }
      );
      episodeResources = episode;

      // Respond to the initial range request
      if (request.headers.range === 'bytes=0-1') {
        response.set('Content-Range', '*');
        response.set('Content-Type', 'audio/mp3');
        response.set('Keep-Alive', 'timeout=620, max=0');
        response.set('Accept-Ranges', 'none');
        return response.sendStatus(200).end();
      }

      // Set response headers
      response.set('Content-Range', '*');
      response.set('Content-Type', 'audio/mp3');
      response.set('Keep-Alive', 'timeout=620, max=0');
      response.set('Accept-Ranges', 'none');

      // Pipe transcoder output to response
      episode.transcoder
        .pipe(response, { end: true })
        .on('close', () => {
          logger.debug(`Transcoder pipe closed`, {
            component: 'streamHandler',
            requestId,
          });
        })
        .on('error', (error: Error) => {
          if (!isExpectedDisconnect(error)) {
            logger.error(`Transcoder pipe error`, error, {
              component: 'streamHandler',
              requestId,
            });
          }
        });

      // Handle client disconnect/abort
      request.on('close', () => {
        logger.info(`Client connection closed`, {
          component: 'streamHandler',
          requestId,
        });
        episodeResources?.abortManager?.abort();
        episodeResources?.cleanup?.();
      });

      request.on('aborted', () => {
        logger.info(`Client request aborted`, {
          component: 'streamHandler',
          requestId,
        });
        episodeResources?.abortManager?.abort();
        episodeResources?.cleanup?.();
      });
    } catch (error) {
      logger.error(`Error building episode`, error, {
        component: 'streamHandler',
        requestId,
      });

      episodeResources?.abortManager?.abort();
      episodeResources?.cleanup?.();

      if (!response.headersSent) {
        response.status(500).json({ error: 'Failed to build episode' });
      }
    }
  };
