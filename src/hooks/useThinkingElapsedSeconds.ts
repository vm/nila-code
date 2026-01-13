import { useEffect, useState } from 'react';

export function useThinkingElapsedSeconds(params: {
  isLoading: boolean;
  hasToolCalls: boolean;
  thinkingStartTime?: number | null;
}): number | null {
  const { isLoading, hasToolCalls, thinkingStartTime } = params;
  const [thinkingElapsedSeconds, setThinkingElapsedSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading || hasToolCalls || !thinkingStartTime) {
      setThinkingElapsedSeconds(null);
      return;
    }

    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - thinkingStartTime) / 1000);
      setThinkingElapsedSeconds(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 100);
    return () => clearInterval(interval);
  }, [hasToolCalls, isLoading, thinkingStartTime]);

  return thinkingElapsedSeconds;
}


