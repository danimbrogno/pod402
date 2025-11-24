import { Job } from 'bullmq';
import { buildEpisode, Config } from '@project/audio-generation';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { episodes } from '@project/drizzle';
import { eq } from 'drizzle-orm';
import { mkdir, stat } from 'fs/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { MeditationJobData } from '../queue';
import { facilitator } from '@coinbase/x402';
import { getAssetsDir } from '@project/common';

/**
 * Process a meditation generation job
 */
export async function processMeditationJob(
  job: Job<MeditationJobData>,
): Promise<void> {
  const { episodeId, prompt, voice, ambience, length, userId } = job.data;
  const jobId = job.id!;

  console.log(
    `[meditationProcessor] Processing job ${jobId} for episode ${episodeId}`,
  );

  try {
    // Get database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const client = postgres(connectionString);
    const db = drizzle(client);

    // Update episode with jobId
    await db
      .update(episodes)
      .set({ jobId: jobId.toString() })
      .where(eq(episodes.uuid, episodeId));

    // Get configuration
    const environment =
      (process.env.NODE_ENV as 'development' | 'production') || 'development';
    const config: Config = {
      environment,
      receivingWallet: process.env.RECEIVING_WALLET || '',
      network: environment === 'production' ? 'base' : 'base-sepolia',
      facilitator: environment === 'production' ? facilitator : undefined,
      channels: 2,
      frequency: 44100,
      bytesPerSample: 2,
      format: 1,
      ffmpeg: {
        ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
        ffprobePath: process.env.FFPROBE_PATH || '/usr/bin/ffprobe',
      },
      ambience: {
        quality: environment === 'development' ? 'dev' : 'prod',
      },
      levels: {
        ambience: 0.25,
        narration: 0.75,
      },
      compressor: {
        threshold: -50,
        knee: 40,
        ratio: 12,
        attack: 0,
        release: 0.25,
      },
      timing: {
        delayAfterNarrationSentence: 1.5,
        delayBeforeFirstNarration: 0,
        fadeIn: 3,
        fadeOut: 10,
        maxLength: 60 * 60,
      },
      openai: {
        speechInstruction:
          'Speak like a meditation coach. Calm, soothing, slow and softly.',
        textInstruction: (
          length: number,
        ) => `You are a world renowned meditation coach at the start of a session with a client.
      You are going to guide them through a meditation that will last about ${length} words.
      You should jump straight into the meditation without any introduction.
      End the meditation with some expression of thanks for taking the time to meditate.
      `,
      },
      errorMessage:
        "Sorry, I'm having trouble generating a meditation right now. Please try again later.",
      assetsDir: getAssetsDir(),
    };

    // Determine output directory
    const outputDir = process.env.EPISODES_OUTPUT_DIR || './episodes';
    await mkdir(outputDir, { recursive: true });

    // Generate output file path
    const outputFileName = `${episodeId}.mp3`;
    const outputPath = join(outputDir, outputFileName);

    // Create a file write stream
    const fileStream = createWriteStream(outputPath);

    // Build the episode
    console.log(
      `[meditationProcessor] Starting episode build for job ${jobId}`,
    );

    // Track when meditation completes (but don't cleanup yet - wait for file stream)
    let meditationCompleted = false;
    const episodeResult = await buildEpisode(
      config,
      length,
      async () => {
        console.log(
          `[meditationProcessor] Episode build completed for job ${jobId}`,
        );
        meditationCompleted = true;
        // Don't call cleanup here - wait for file stream to finish first
      },
      {
        prompt,
        voice,
        ambience,
      },
    );

    // Pipe transcoder output directly to file
    if (episodeResult.transcoder) {
      episodeResult.transcoder.pipe(fileStream, { end: true });
    }

    // Wait for both the transcoder to end AND the file stream to finish
    // The transcoder ending means all audio data has been generated
    // The file stream finishing means all data has been written to disk
    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      let transcoderEnded = false;
      let fileStreamFinished = false;

      const checkComplete = async () => {
        if (resolved) return;
        // Wait for both transcoder to end and file stream to finish
        // If cleanup killed the transcoder early, we still wait for file stream
        if (fileStreamFinished && (transcoderEnded || meditationCompleted)) {
          resolved = true;
          // Get file size after writing is complete
          const stats = await stat(outputPath);
          const fileSize = stats.size;
          console.log(
            `[meditationProcessor] Audio file written: ${outputPath} (${fileSize} bytes)`,
          );
          resolve();
        }
      };

      const errorHandler = (error: Error) => {
        if (resolved) return;
        resolved = true;
        console.error(
          `[meditationProcessor] Stream error for job ${jobId}:`,
          error,
        );
        reject(error);
      };

      // Listen for file stream finish
      fileStream.once('finish', async () => {
        console.log(
          `[meditationProcessor] File stream finished for job ${jobId}`,
        );
        fileStreamFinished = true;
        await checkComplete();
      });
      fileStream.once('error', errorHandler);

      // Listen for transcoder end/close events
      if (episodeResult.transcoder) {
        episodeResult.transcoder.once('end', () => {
          console.log(
            `[meditationProcessor] Transcoder ended for job ${jobId}`,
          );
          transcoderEnded = true;
          checkComplete();
        });
        episodeResult.transcoder.once('close', () => {
          console.log(
            `[meditationProcessor] Transcoder closed for job ${jobId}`,
          );
          transcoderEnded = true;
          checkComplete();
        });
        episodeResult.transcoder.once('error', (err: Error) => {
          // Only reject if it's a real error (not just stream closed)
          const isExpectedDisconnect =
            err.message === 'Output stream closed' ||
            err.message.includes('stream closed') ||
            err.message.includes('EPIPE') ||
            err.message.includes('ECONNRESET') ||
            err.message.includes('SIGTERM');

          if (isExpectedDisconnect) {
            console.log(
              `[meditationProcessor] Transcoder disconnected (expected) for job ${jobId}`,
            );
            transcoderEnded = true;
            checkComplete();
          } else if (!resolved) {
            console.error(
              `[meditationProcessor] Transcoder error for job ${jobId}:`,
              err,
            );
            errorHandler(err);
          }
        });
      } else {
        // No transcoder, just wait for file stream
        transcoderEnded = true;
      }

      // Set a timeout to prevent hanging
      const timeout = setTimeout(
        () => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Audio generation timeout'));
          }
        },
        config.timing.maxLength * 1000 + 60000,
      ); // maxLength + 1 minute buffer

      // Clear timeout when complete
      fileStream.once('finish', () => clearTimeout(timeout));
      fileStream.once('error', () => clearTimeout(timeout));
    });

    // Get file size for database update
    const stats = await stat(outputPath);
    const fileSize = stats.size;
    const contentType = 'audio/mp3';
    const url = `/episodes/${outputFileName}`; // This should be adjusted based on your storage solution

    await db
      .update(episodes)
      .set({
        audio: outputPath,
        url,
        contentType,
        size: fileSize,
        updatedAt: new Date(),
      })
      .where(eq(episodes.uuid, episodeId));

    console.log(
      `[meditationProcessor] Episode ${episodeId} updated in database`,
    );

    // Cleanup
    if (episodeResult.cleanup) {
      episodeResult.cleanup();
    }
    await client.end();

    console.log(`[meditationProcessor] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(
      `[meditationProcessor] Error processing job ${jobId}:`,
      error,
    );

    // Update episode with error status if needed
    try {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      const client = postgres(connectionString);
      const db = drizzle(client);

      // You might want to add an error field to episodes table in the future
      // For now, we'll just log the error

      await client.end();
    } catch (dbError) {
      console.error(
        `[meditationProcessor] Error updating database after failure:`,
        dbError,
      );
    }

    throw error; // Re-throw to mark job as failed
  }
}
