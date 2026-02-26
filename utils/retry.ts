import type { AppError } from '../types';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    jitter = true,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 2^attempt * baseDelay
      let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      // Add jitter to prevent thundering herd
      if (jitter) {
        delay += Math.random() * 1000;
      }

      onRetry?.(attempt + 1, lastError);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

// Circuit Breaker Pattern
interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
}

interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: number | null;
}

export function createCircuitBreaker(options: CircuitBreakerOptions = {}) {
  const { failureThreshold = 5, resetTimeout = 30000 } = options;
  
  const state: CircuitBreakerState = {
    status: 'closed',
    failures: 0,
    lastFailureTime: null,
  };

  return async function execute<T>(fn: () => Promise<T>): Promise<T> {
    if (state.status === 'open') {
      const timeSinceLastFailure = Date.now() - (state.lastFailureTime || 0);
      
      if (timeSinceLastFailure >= resetTimeout) {
        state.status = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      
      // Success: reset state
      if (state.status === 'half-open') {
        state.status = 'closed';
        state.failures = 0;
      }
      
      return result;
    } catch (error) {
      state.failures++;
      state.lastFailureTime = Date.now();

      if (state.failures >= failureThreshold) {
        state.status = 'open';
      }

      throw error;
    }
  };
}

// Rate Limiter
interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs } = options;
  const requests: number[] = [];

  return function checkLimit(): boolean {
    const now = Date.now();
    
    // Remove requests outside the window
    while (requests.length > 0 && requests[0] <= now - windowMs) {
      requests.shift();
    }

    if (requests.length >= maxRequests) {
      return false;
    }

    requests.push(now);
    return true;
  };
}
