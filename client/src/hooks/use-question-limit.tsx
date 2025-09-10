import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';

interface QuestionLimit {
  remaining: number;
  limit: number;
  canAsk: boolean;
}

interface QuestionLimitContextType {
  questionLimit: QuestionLimit | null;
  setQuestionLimit: (limit: QuestionLimit | null) => void;
  refreshQuestionLimit: (userId: number) => Promise<void>;
  isLoading: boolean;
  quotaError: string | null;
}

const QuestionLimitContext = createContext<QuestionLimitContextType | undefined>(undefined);

// Cache for quota data to prevent duplicate requests
const quotaCache = new Map<string, { data: QuestionLimit; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache
const inFlightRequests = new Map<string, Promise<QuestionLimit>>();

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export function QuestionLimitProvider({ children }: { children: ReactNode }) {
  const [questionLimit, setQuestionLimit] = useState<QuestionLimit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const fetchCooldown = 5000; // 5 second cooldown between fetches

  const refreshQuestionLimit = useCallback(async (userId: number) => {
    const now = Date.now();
    const cacheKey = `quota-${userId}`;
    
    // Check cache first
    const cached = quotaCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setQuestionLimit(cached.data);
      return;
    }
    
    // Check cooldown to prevent rapid successive calls
    if (now - lastFetchTime.current < fetchCooldown) {
      console.log('Quota fetch cooldown active, skipping request');
      return;
    }
    
    // Check if request is already in flight
    if (inFlightRequests.has(cacheKey)) {
      console.log('Quota request already in flight, waiting for result');
      try {
        const result = await inFlightRequests.get(cacheKey);
        setQuestionLimit(result);
        return;
      } catch (error) {
        // Let the original request handle the error
        return;
      }
    }
    
    lastFetchTime.current = now;
    setIsLoading(true);
    setQuotaError(null);
    
    const fetchPromise = retryWithBackoff(async () => {
      const response = await fetch(`/api/users/${userId}/limit`, {
        credentials: 'include',
        headers: {
          'x-request-id': `quota-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('quota-auth');
        }
        throw new Error(`quota-${response.status}`);
      }
      
      return response.json();
    }, 2, 1000); // Reduced retries to prevent spam
    
    // Store the promise to prevent duplicate requests
    inFlightRequests.set(cacheKey, fetchPromise);
    
    try {
      const limitData = await fetchPromise;
      
      const quotaData = {
        remaining: limitData.remaining,
        limit: limitData.limit,
        canAsk: limitData.canAsk
      };
      
      // Cache the result
      quotaCache.set(cacheKey, { data: quotaData, timestamp: now });
      
      setQuestionLimit(quotaData);
    } catch (error: any) {
      console.error('Error fetching question limit:', error);
      
      // Map specific errors to user-friendly messages
      if (error.message === 'quota-auth') {
        setQuotaError('Please sign in again');
      } else if (error.message?.includes('quota-429')) {
        setQuotaError('Rate limited. Try again in ~30s');
      } else if (error.message?.includes('quota-5')) {
        setQuotaError('Service hiccup. Retrying...');
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_')) {
        setQuotaError('Network error. Check connection');
      } else {
        setQuotaError('Usage unavailable');
      }
      
      // Don't block the app - just show fallback
      setQuestionLimit(null);
    } finally {
      setIsLoading(false);
      // Remove from in-flight requests
      inFlightRequests.delete(cacheKey);
    }
  }, []);

  return (
    <QuestionLimitContext.Provider value={{
      questionLimit,
      setQuestionLimit,
      refreshQuestionLimit,
      isLoading,
      quotaError
    }}>
      {children}
    </QuestionLimitContext.Provider>
  );
}

export function useQuestionLimit() {
  const context = useContext(QuestionLimitContext);
  if (context === undefined) {
    throw new Error('useQuestionLimit must be used within a QuestionLimitProvider');
  }
  return context;
}
