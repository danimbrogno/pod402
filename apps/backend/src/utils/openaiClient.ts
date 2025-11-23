/**
 * Configured OpenAI client with retry logic and error handling
 */

import OpenAI from 'openai';
import { logger } from './logger';

export function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return new OpenAI({
    apiKey,
    maxRetries: 3, // Retry up to 3 times on transient failures
    timeout: 60000, // 60 second timeout per request
    // The SDK will automatically retry on:
    // - Network errors (ECONNRESET, ETIMEDOUT, etc.)
    // - 429 (rate limit) errors
    // - 500-599 (server errors)
  });
}

/**
 * Execute an OpenAI operation with retry and error handling
 * Note: The OpenAI SDK handles retries automatically, but this wrapper
 * provides better error messages and logging
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: { component: string; operation: string }
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    // Check if it's an OpenAI API error
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'message' in error
    ) {
      const apiError = error as { status?: number; message: string };
      const status = apiError.status;

      // Check if it's a retryable error
      const isRetryable =
        status === 429 || // Rate limit
        status === 500 || // Internal server error
        status === 502 || // Bad gateway
        status === 503 || // Service unavailable
        status === 504; // Gateway timeout

      if (isRetryable && status) {
        logger.warn(
          `Retryable OpenAI error (${status}): ${apiError.message}`,
          context
        );
        // The SDK should have already retried, but if we get here,
        // it means all retries were exhausted
        throw new Error(
          `OpenAI API error after retries: ${apiError.message} (status: ${status})`
        );
      }

      // Non-retryable errors (4xx except 429)
      if (status) {
        logger.error(
          `Non-retryable OpenAI error (${status}): ${apiError.message}`,
          error as Error,
          context
        );
        throw new Error(
          `OpenAI API error: ${apiError.message} (status: ${status})`
        );
      }
    }

    // Network or other errors
    logger.error(
      `OpenAI operation failed: ${String(error)}`,
      error,
      context
    );
    throw error;
  }
}
