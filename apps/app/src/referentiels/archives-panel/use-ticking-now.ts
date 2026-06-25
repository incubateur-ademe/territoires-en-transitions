import { useEffect, useState } from 'react';

const TICK_INTERVAL_MS = 30_000;

export function useTickingNow(isActive: boolean): number {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNowMs(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isActive]);

  return nowMs;
}
