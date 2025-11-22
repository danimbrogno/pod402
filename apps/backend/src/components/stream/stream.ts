import { RequestHandler } from 'express';
import { buildEpisode } from './components/buildEpisode/buildEpisode';
import { Config } from '../../interface';

export const streamHandler =
  (config: Config, length: number): RequestHandler =>
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
      // Callback to close response when meditation completes
      const onMeditationComplete = () => {
        console.log(
          `[streamHandler] Request ${requestId} - Meditation completed, closing response`
        );
        if (!response.writableEnded && !response.destroyed) {
          try {
            response.end();
            console.log(
              `[streamHandler] Request ${requestId} - Response closed`
            );
          } catch (error) {
            // Response may already be closed, ignore error
            console.log(
              `[streamHandler] Request ${requestId} - Response already closed`
            );
          }
        }
      };

      console.log(`[streamHandler] Request ${requestId} - Query params:`, {
        prompt: request.query.prompt,
        voice: request.query.voice,
        ambience: request.query.ambience,
        length,
      });

      const episode = await buildEpisode(config, length, onMeditationComplete, {
        prompt: request.query.prompt as string | undefined,
        voice: request.query.voice as string | undefined,
        ambience: request.query.ambience as string | undefined,
      });
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
