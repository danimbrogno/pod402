/**
 * Centralized logging utility for consistent log formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  component?: string;
  [key: string]: unknown;
}

class Logger {
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context
      ? ` [${Object.entries(context)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}]`
      : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMessage =
      error instanceof Error
        ? `${message}: ${error.message}`
        : `${message}: ${String(error)}`;
    const fullContext = error instanceof Error
      ? { ...context, stack: error.stack }
      : context;
    console.error(this.formatMessage('error', errorMessage, fullContext));
  }
}

export const logger = new Logger();
