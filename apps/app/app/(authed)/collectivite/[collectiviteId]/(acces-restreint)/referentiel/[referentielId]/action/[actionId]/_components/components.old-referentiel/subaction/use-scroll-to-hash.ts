'use client';

import { useStickyHeaderHeight } from '@tet/ui';
import { useEffect, useRef } from 'react';

const MAX_PARENT_LEVELS = 2;

const findElementByHashOrParent = (hash: string): HTMLElement | null => {
  const segments = hash.split('.');
  return Array.from({ length: MAX_PARENT_LEVELS + 1 })
    .map((_, i) => segments.slice(0, segments.length - i).join('.'))
    .filter(Boolean)
    .reduce<HTMLElement | null>(
      (found, id) => found ?? document.getElementById(id),
      null
    );
};

export const useScrollToHash = (hash: string): void => {
  const stickyHeaderHeight = useStickyHeaderHeight();
  const stickyHeaderHeightRef = useRef(stickyHeaderHeight);

  useEffect(() => {
    stickyHeaderHeightRef.current = stickyHeaderHeight;
  }, [stickyHeaderHeight]);

  useEffect(() => {
    if (!hash) return;
    const raf = requestAnimationFrame(() => {
      const target = findElementByHashOrParent(hash);
      if (!target) return;
      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        stickyHeaderHeightRef.current;
      window.scrollTo({ top, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [hash]);
};
