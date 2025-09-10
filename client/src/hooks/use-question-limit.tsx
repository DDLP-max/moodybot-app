import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

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
}

const QuestionLimitContext = createContext<QuestionLimitContextType | undefined>(undefined);

export function QuestionLimitProvider({ children }: { children: ReactNode }) {
  const [questionLimit, setQuestionLimit] = useState<QuestionLimit | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshQuestionLimit = async (userId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/limit`);
      if (response.ok) {
        const limitData = await response.json();
        setQuestionLimit({
          remaining: limitData.remaining,
          limit: limitData.limit,
          canAsk: limitData.canAsk
        });
      } else {
        console.error('Failed to fetch question limit:', response.status);
      }
    } catch (error) {
      console.error('Error fetching question limit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <QuestionLimitContext.Provider value={{
      questionLimit,
      setQuestionLimit,
      refreshQuestionLimit,
      isLoading
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
