'use client';

import { useEffect } from 'react';

const MAX_PARENT_LEVELS = 2;

/** Cherche un élément DOM par son id (ex: "1.2.3"), puis remonte dans la hiérarchie ("1.2", "1")
 * jusqu'à trouver une correspondance. Permet d'expand et scroller jusqu'à une sous-action
 * lorsque le hash cible une tâche pas encore présente dans le DOM car dans une sous-action qui n'est pas expand. */
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
  useEffect(() => {
    if (!hash) return;
    requestAnimationFrame(() => {
      findElementByHashOrParent(hash)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [hash]);
};
