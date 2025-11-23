/**
 * Timeout manager for enforcing maximum meditation duration
 * Ensures meditations never run forever
 */

import { logger } from './logger';

export class TimeoutManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private startTime: number;
  private maxDuration: number; // in seconds
  private onTimeout: () => void;

  constructor(maxDuration: number, onTimeout: () => void) {
    this.maxDuration = maxDuration;
    this.onTimeout = onTimeout;
    this.startTime = Date.now();
  }

  /**
   * Start the timeout timer
   */
  start(): void {
    if (this.timeoutId) {
      return; // Already started
    }

    const timeoutMs = this.maxDuration * 1000;
    logger.info(`Starting timeout manager: max duration ${this.maxDuration}s`);

    this.timeoutId = setTimeout(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      logger.warn(
        `Hard stop triggered: meditation exceeded max duration of ${this.maxDuration}s (elapsed: ${elapsed.toFixed(1)}s)`
      );
      this.onTimeout();
    }, timeoutMs);
  }

  /**
   * Stop the timeout timer
   */
  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      const elapsed = (Date.now() - this.startTime) / 1000;
      logger.info(`Timeout manager stopped: elapsed ${elapsed.toFixed(1)}s`);
    }
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsed(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Get remaining time in seconds
   */
  getRemaining(): number {
    return Math.max(0, this.maxDuration - this.getElapsed());
  }
}
