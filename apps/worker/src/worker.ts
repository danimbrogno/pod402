import { createWorker, closeQueue } from './queue';
import { processMeditationJob } from './processors/meditationProcessor';

console.log('[worker] Starting meditation worker...');

// Create and start the worker
const worker = createWorker(async (job) => {
  console.log(`[worker] Received job ${job.id} with data:`, job.data);
  await processMeditationJob(job);
});

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('[worker] Worker error:', err);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[worker] Shutting down gracefully...');
  await worker.close();
  await closeQueue();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[worker] Meditation worker started and ready to process jobs');
