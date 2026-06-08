'use client';

import { RefObject, useEffect, useRef, useState } from 'react';

type UseStickyResult = {
  isSticky: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  pinnedMinHeight: number | undefined;
};

export function useSticky(enabled: boolean): UseStickyResult {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [originalHeight, setOriginalHeight] = useState<number | undefined>();

  useEffect(() => {
    if (!enabled) return;
    const sentinel = sentinelRef.current;
    if (sentinel === null) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const header = headerRef.current;
    if (header === null) return;
    const observer = new ResizeObserver(() => {
      setOriginalHeight(header.offsetHeight);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, [enabled]);

  const pinned = enabled && isSticky;
  return {
    isSticky: pinned,
    sentinelRef,
    headerRef,
    pinnedMinHeight: pinned ? originalHeight : undefined,
  };
}
