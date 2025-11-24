import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import Redis from 'ioredis';

// Job data interface for meditation processing
export interface MeditationJobData {
  episodeId: string;
  prompt?: string;
  voice?: string;
  ambience?: string;
  length: number;
  userId: string;
}

// Create Redis connection
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queue options
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
};

// Worker options
const workerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: 1, // Process one job at a time to avoid resource conflicts
  limiter: {
    max: 1,
    duration: 1000,
  },
};

// Create queue instance
export const meditationQueue = new Queue<MeditationJobData>(
  'meditation-generation',
  queueOptions
);

// Create worker instance (will be initialized in worker.ts)
export function createWorker(
  processor: (job: { data: MeditationJobData }) => Promise<void>
): Worker<MeditationJobData> {
  return new Worker<MeditationJobData>(
    'meditation-generation',
    processor,
    workerOptions
  );
}

// Helper function to add a job to the queue
export async function addMeditationJob(data: MeditationJobData) {
  const job = await meditationQueue.add('process-meditation', data);
  return job.id;
}

// Graceful shutdown helper
export async function closeQueue() {
  await meditationQueue.close();
  await redisConnection.quit();
}
