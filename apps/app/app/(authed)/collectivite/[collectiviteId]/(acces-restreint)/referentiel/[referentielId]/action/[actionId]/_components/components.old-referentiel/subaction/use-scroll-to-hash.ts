'use client';

import { useEffect } from 'react';

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

const readStickyHeaderHeight = (): number => {
  const sticky = document.querySelector<HTMLElement>('[data-sticky-header]');
  return sticky?.getBoundingClientRect().height ?? 0;
};

export const useScrollToHash = (hash: string): void => {
  useEffect(() => {
    if (!hash) return;
    requestAnimationFrame(() => {
      const target = findElementByHashOrParent(hash);
      if (!target) return;
      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        readStickyHeaderHeight();
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }, [hash]);
};
