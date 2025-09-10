interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

interface APIError {
  code: string;
  message: string;
  remaining?: number;
  limit?: number;
}

class FetchError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public remaining?: number,
    public limit?: number
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

// Circuit breaker state
let circuitBreakerFailures = 0;
let circuitBreakerLastFailure = 0;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export async function fetchJSON<T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { retries = 3, retryDelay = 500, ...fetchOptions } = options;
  
  // Check circuit breaker
  const now = Date.now();
  if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    if (now - circuitBreakerLastFailure < CIRCUIT_BREAKER_TIMEOUT) {
      throw new FetchError(503, 'CIRCUIT_BREAKER_OPEN', 'Service temporarily unavailable');
    } else {
      // Reset circuit breaker
      circuitBreakerFailures = 0;
    }
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'x-request-id': requestId,
  };

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, config);
      
      if (response.ok) {
        // Reset circuit breaker on success
        circuitBreakerFailures = 0;
        return await response.json();
      }

      // Handle different error types
      const errorData: APIError = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred'
      }));

      if (response.status === 429) {
        // Rate limit exceeded
        throw new FetchError(
          response.status,
          errorData.code,
          errorData.message,
          errorData.remaining,
          errorData.limit
        );
      }

      if (response.status >= 500) {
        // Server error - retry
        lastError = new FetchError(
          response.status,
          errorData.code,
          errorData.message
        );
        
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Client error - don't retry
      throw new FetchError(
        response.status,
        errorData.code,
        errorData.message
      );

    } catch (error) {
      if (error instanceof FetchError) {
        throw error;
      }

      // Network error - retry
      lastError = error as Error;
      
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All retries failed
  circuitBreakerFailures++;
  circuitBreakerLastFailure = now;
  
  throw lastError || new FetchError(0, 'NETWORK_ERROR', 'Network request failed');
}

export { FetchError };
