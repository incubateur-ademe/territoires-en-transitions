'use client';

import { useSyncExternalStore } from 'react';

/** `history.pushState` ne déclenche pas d'évènement natif : on chaîne un wrapper
 * qui notifie le listener, et on restaure la version précédente au cleanup. */
const subscribe = (listener: () => void): (() => void) => {
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);

  const previousPushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    previousPushState(...args);
    listener();
  };

  return () => {
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
    history.pushState = previousPushState;
  };
};

const getSnapshot = (): string =>
  typeof window !== 'undefined' ? window.location.hash.slice(1) : '';

const getServerSnapshot = (): string => '';

/** Retourne le hash courant de l'URL (sans le `#`) et re-rend le composant lors
 * des changements (`hashchange`, `popstate`, `history.pushState`). */
export const useGetURLHash = (): string =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
