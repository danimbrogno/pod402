import { RequestHandler } from 'express';
import { buildEpisode } from './components/buildEpisode/buildEpisode';
import { Config } from '../../interface';
import { db, schema } from '../../utils/db';
import { eq } from 'drizzle-orm';

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

      // Get wallet address from x402 payment info
      // x402-express adds payment metadata to the request
      const walletAddress = (request as any).x402?.payer?.address || 
                           (request as any).payment?.payer?.address ||
                           (request as any).payer?.address;

      const prompt = (request.query.prompt as string) || 'Give me a meditation about gratitude';
      const voice = (request.query.voice as string) || 'nova';
      const ambience = (request.query.ambience as string) || '1';

      let meditationUuid: string | null = null;
      let meditationUrl: string | null = null;

      // Save meditation to database if wallet address is available
      if (walletAddress) {
        try {
          // Find or create user by wallet address
          const existingUsers = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.address, walletAddress))
            .limit(1);

          let user = existingUsers[0] || null;

          if (!user) {
            const [newUser] = await db
              .insert(schema.users)
              .values({ address: walletAddress })
              .returning();
            user = newUser;
          }

          // Generate meditation URL (using stream endpoint with parameters)
          const baseUrl = `${request.protocol}://${request.get('host')}`;
          meditationUrl = `${baseUrl}/stream?prompt=${encodeURIComponent(prompt)}&voice=${encodeURIComponent(voice)}&ambience=${encodeURIComponent(ambience)}`;

          // Create meditation record
          const [meditation] = await db
            .insert(schema.meditations)
            .values({
              prompt,
              voice,
              ambience,
              url: meditationUrl,
              userId: user.uuid,
            })
            .returning();

          meditationUuid = meditation.uuid;
          console.log(
            `[streamHandler] Request ${requestId} - Meditation saved with UUID: ${meditationUuid}`
          );
        } catch (error) {
          console.error(
            `[streamHandler] Request ${requestId} - Error saving meditation:`,
            error
          );
          // Continue with streaming even if database save fails
        }
      }

      const episode = await buildEpisode(config, length, onMeditationComplete, {
        prompt,
        voice,
        ambience,
      });
      episodeResources = episode;
      console.log(
        `[streamHandler] Request ${requestId} - Episode build completed`
      );

      // Store meditation UUID and URL for response
      (response as any).meditationUuid = meditationUuid;
      (response as any).meditationUrl = meditationUrl;

      // Respond to the initial range request
      if (request.headers.range === 'bytes=0-1') {
        response.set('Content-Range', '*');
        response.set('Content-Type', 'audio/mp3');
        response.set('Keep-Alive', 'timeout=620, max=0');
        response.set('Accept-Ranges', 'none');
        // Add meditation metadata headers
        if (meditationUuid) {
          response.set('X-Meditation-UUID', meditationUuid);
        }
        if (meditationUrl) {
          response.set('X-Meditation-URL', meditationUrl);
        }
        return response.sendStatus(200).end();
      }
      response.set('Content-Range', '*');
      response.set('Content-Type', 'audio/mp3');
      response.set('Keep-Alive', 'timeout=620, max=0');
      response.set('Accept-Ranges', 'none');
      // Add meditation metadata headers
      if (meditationUuid) {
        response.set('X-Meditation-UUID', meditationUuid);
      }
      if (meditationUrl) {
        response.set('X-Meditation-URL', meditationUrl);
      }

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
