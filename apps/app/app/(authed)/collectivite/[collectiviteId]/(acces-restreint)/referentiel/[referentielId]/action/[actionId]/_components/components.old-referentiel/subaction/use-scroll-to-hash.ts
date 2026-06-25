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
  const userScrolledRef = useRef(false);

  useEffect(() => {
    userScrolledRef.current = false;
    if (!hash) return;
    const markUserScrolled = (): void => {
      userScrolledRef.current = true;
    };
    window.addEventListener('wheel', markUserScrolled, { passive: true });
    window.addEventListener('touchmove', markUserScrolled, { passive: true });
    return () => {
      window.removeEventListener('wheel', markUserScrolled);
      window.removeEventListener('touchmove', markUserScrolled);
    };
  }, [hash]);

  useEffect(() => {
    if (!hash || userScrolledRef.current) return;
    const raf = requestAnimationFrame(() => {
      const target = findElementByHashOrParent(hash);
      if (!target) return;
      const top =
        target.getBoundingClientRect().top + window.scrollY - stickyHeaderHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [hash, stickyHeaderHeight]);
};
