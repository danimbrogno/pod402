/**
 * Centralized abort manager for meditation sessions
 * Prevents redundant checks and provides clean abort handling
 */

export class AbortManager {
  private aborted = false;
  private abortController: AbortController;
  private abortListeners: Set<() => void> = new Set();

  constructor() {
    this.abortController = new AbortController();
  }

  /**
   * Check if the operation has been aborted
   */
  isAborted(): boolean {
    return this.aborted;
  }

  /**
   * Get the AbortSignal for passing to async operations
   */
  getSignal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Register a cleanup function to be called on abort
   */
  onAbort(cleanup: () => void): void {
    this.abortListeners.add(cleanup);
  }

  /**
   * Remove a cleanup function
   */
  offAbort(cleanup: () => void): void {
    this.abortListeners.delete(cleanup);
  }

  /**
   * Abort the operation and run all cleanup functions
   */
  abort(): void {
    if (this.aborted) {
      return;
    }

    this.aborted = true;
    this.abortController.abort();

    // Run all cleanup functions
    for (const cleanup of this.abortListeners) {
      try {
        cleanup();
      } catch (error) {
        // Ignore errors in cleanup
      }
    }

    this.abortListeners.clear();
  }

  /**
   * Throw an error if aborted
   */
  throwIfAborted(): void {
    if (this.aborted) {
      throw new Error('Operation aborted');
    }
  }
}
