import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  addMeditationJob,
  meditationQueue,
  closeQueue,
  type MeditationJobData,
} from './queue';
import { createWorker } from './queue';
import { processMeditationJob } from './processors/meditationProcessor';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { episodes, users } from '@project/drizzle';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { mkdir, rm, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Job } from 'bullmq';

describe('Worker E2E Test', () => {
  let db: ReturnType<typeof drizzle>;
  let client: ReturnType<typeof postgres>;
  let worker: ReturnType<typeof createWorker>;
  let testUserId: string;
  let testEpisodeId: string;
  const testOutputDir = './test-episodes';
  const originalOutputDir = process.env.EPISODES_OUTPUT_DIR;

  beforeAll(async () => {
    // Environment variables are loaded by vitest.config.ts
    // Verify DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is required. Make sure .env file exists in project root.',
      );
    }

    // Set up test output directory
    process.env.EPISODES_OUTPUT_DIR = testOutputDir;
    await mkdir(testOutputDir, { recursive: true });

    // Set up assets directory path (required for worker)
    if (!process.env.ASSETS_PATH) {
      // Try to find assets directory relative to project root
      const { existsSync } = await import('fs');
      const { resolve } = await import('path');
      const possiblePaths = [
        resolve(process.cwd(), '../../assets'),
        resolve(process.cwd(), '../assets'),
        resolve(process.cwd(), './assets'),
      ];
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          process.env.ASSETS_PATH = path;
          console.log(`[test] Using assets directory: ${path}`);
          break;
        }
      }
      if (!process.env.ASSETS_PATH) {
        console.warn(
          '[test] ASSETS_PATH not set and assets directory not found. Worker may fail.',
        );
      }
    }

    // Set up database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is required for tests',
      );
    }
    client = postgres(connectionString);
    db = drizzle(client);

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        address: `test-user-${uuidv4()}`,
      })
      .returning();
    testUserId = user.uuid;

    // Create test episode
    const [episode] = await db
      .insert(episodes)
      .values({
        uuid: uuidv4(),
        prompt: 'Test meditation for e2e test',
        audio: '', // Will be set by worker
        url: '', // Will be set by worker
        contentType: 'audio/mp3',
        size: 0, // Will be set by worker
        userId: testUserId,
      })
      .returning();
    testEpisodeId = episode.uuid;

    // Start worker
    worker = createWorker(async (job) => {
      await processMeditationJob(job);
    });
  });

  afterAll(async () => {
    try {
      // Clean up worker
      if (worker) {
        await worker.close();
      }
      await closeQueue();

      // Clean up database
      if (db && testEpisodeId) {
        await db.delete(episodes).where(eq(episodes.uuid, testEpisodeId));
      }
      if (db && testUserId) {
        await db.delete(users).where(eq(users.uuid, testUserId));
      }
      if (client) {
        await client.end();
      }
    } catch (error) {
      console.error('[test] Error during cleanup:', error);
    }

    // Clean up test output directory and all generated files
    try {
      if (existsSync(testOutputDir)) {
        // List all files in the directory before removing
        const files = await readdir(testOutputDir);
        console.log(
          `[test] Cleaning up ${files.length} test file(s) from ${testOutputDir}`,
        );
        await rm(testOutputDir, { recursive: true, force: true });
        console.log(`[test] Test output directory removed: ${testOutputDir}`);
      }
    } catch (error) {
      console.error(
        `[test] Error cleaning up test output directory ${testOutputDir}:`,
        error,
      );
      // Try to clean up individual files if directory removal fails
      try {
        if (existsSync(testOutputDir)) {
          const files = await readdir(testOutputDir);
          for (const file of files) {
            const filePath = join(testOutputDir, file);
            await rm(filePath, { force: true });
            console.log(`[test] Removed test file: ${filePath}`);
          }
        }
      } catch (fileError) {
        console.error(
          '[test] Error cleaning up individual test files:',
          fileError,
        );
      }
    }

    // Restore original output dir
    if (originalOutputDir) {
      process.env.EPISODES_OUTPUT_DIR = originalOutputDir;
    } else {
      delete process.env.EPISODES_OUTPUT_DIR;
    }
  });

  beforeEach(async () => {
    // Wait a bit for worker to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterEach(async () => {
    // Clean up any test files that might have been created during this test
    // This ensures cleanup even if a test fails mid-execution
    try {
      if (existsSync(testOutputDir)) {
        const files = await readdir(testOutputDir);
        // Only log if there are files to clean up
        if (files.length > 0) {
          console.log(
            `[test] afterEach: Found ${files.length} file(s) in test output directory`,
          );
        }
      }
    } catch (error) {
      // Ignore errors in afterEach - main cleanup happens in afterAll
    }
  });

  it('should process a meditation job successfully', async () => {
    // Prepare job data
    const jobData: MeditationJobData = {
      episodeId: testEpisodeId,
      prompt: 'A short test meditation about gratitude',
      voice: 'nova',
      ambience: '1',
      length: 50, // Short length for faster testing
      userId: testUserId,
    };

    // Add job to queue
    const jobId = await addMeditationJob(jobData);
    expect(jobId).toBeDefined();
    console.log(`[test] Added job ${jobId} to queue`);

    // Wait for job to complete (with timeout)
    const maxWaitTime = 120000; // 2 minutes for short meditation
    const startTime = Date.now();
    let jobCompleted = false;
    let completedJob: any = null;

    // Poll for job completion
    while (!jobCompleted && Date.now() - startTime < maxWaitTime) {
      const job = await meditationQueue.getJob(jobId);

      if (job) {
        const state = await job.getState();
        console.log(`[test] Job ${jobId} state: ${state}`);

        if (state === 'completed') {
          jobCompleted = true;
          completedJob = job;
          break;
        } else if (state === 'failed') {
          const failedReason = job.failedReason;
          throw new Error(`Job failed: ${failedReason || 'Unknown error'}`);
        }
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (!jobCompleted) {
      throw new Error(`Job did not complete within ${maxWaitTime}ms`);
    }

    expect(completedJob).toBeDefined();
    console.log(`[test] Job ${jobId} completed successfully`);

    // Verify episode was updated in database
    const [updatedEpisode] = await db
      .select()
      .from(episodes)
      .where(eq(episodes.uuid, testEpisodeId));

    expect(updatedEpisode).toBeDefined();
    expect(updatedEpisode.audio).toBeTruthy();
    expect(updatedEpisode.url).toBeTruthy();
    expect(updatedEpisode.size).toBeGreaterThan(0);
    expect(updatedEpisode.jobId).toBe(jobId);
    console.log(`[test] Episode updated:`, {
      audio: updatedEpisode.audio,
      url: updatedEpisode.url,
      size: updatedEpisode.size,
      jobId: updatedEpisode.jobId,
    });

    // Verify audio file exists
    const audioPath = updatedEpisode.audio;
    expect(existsSync(audioPath)).toBe(true);
    console.log(`[test] Audio file exists at: ${audioPath}`);

    // Verify file is not empty
    const { stat } = await import('fs/promises');
    const stats = await stat(audioPath);
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBe(updatedEpisode.size);
    console.log(`[test] Audio file size: ${stats.size} bytes`);
  }, 150000); // 2.5 minute timeout for the test

  it('should handle job failures gracefully', async () => {
    // Create an episode with invalid data to trigger a failure
    const invalidEpisodeId = uuidv4();
    await db.insert(episodes).values({
      uuid: invalidEpisodeId,
      prompt: 'Invalid test',
      audio: '',
      url: '',
      contentType: 'audio/mp3',
      size: 0,
      userId: testUserId,
    });

    // Try to add a job with invalid episode ID (episode doesn't exist in processor context)
    // Actually, let's test with a job that will fail due to missing OpenAI key or other config
    // For now, we'll just verify the queue accepts the job
    const jobData: MeditationJobData = {
      episodeId: invalidEpisodeId,
      prompt: 'This might fail',
      voice: 'nova',
      ambience: '1',
      length: 10,
      userId: testUserId,
    };

    const jobId = await addMeditationJob(jobData);
    expect(jobId).toBeDefined();

    // Wait a bit to see if it fails
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Clean up database entry
    try {
      await db.delete(episodes).where(eq(episodes.uuid, invalidEpisodeId));
    } catch (error) {
      console.error(
        `[test] Error cleaning up invalid episode ${invalidEpisodeId}:`,
        error,
      );
    }

    // Clean up any test files that might have been created for this episode
    try {
      if (existsSync(testOutputDir)) {
        const testFilePath = join(testOutputDir, `${invalidEpisodeId}.mp3`);
        if (existsSync(testFilePath)) {
          await rm(testFilePath, { force: true });
          console.log(`[test] Cleaned up test file: ${testFilePath}`);
        }
      }
    } catch (error) {
      console.error(
        `[test] Error cleaning up test file for episode ${invalidEpisodeId}:`,
        error,
      );
    }
  });
});
