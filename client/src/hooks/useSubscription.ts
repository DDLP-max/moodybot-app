import { useState, useEffect } from 'react';

interface SubscriptionState {
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSubscription(): SubscriptionState {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For now, always return false (not subscribed)
    // This can be enhanced later to check actual subscription status
    setIsSubscribed(false);
    setIsLoading(false);
  }, []);

  return {
    isSubscribed,
    isLoading,
    error
  };
}
