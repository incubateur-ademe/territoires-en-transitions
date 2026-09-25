import { useSyncExternalStore } from 'react';

const subscribe = (onStoreChange: () => void) => {
  window.addEventListener('resize', onStoreChange);
  return () => window.removeEventListener('resize', onStoreChange);
};

const getSnapshot = () => window.innerWidth;

/**
 * Largeur de la fenêtre, `undefined` côté serveur et au premier rendu client.
 *
 * `useSyncExternalStore` plutôt qu'un état initialisé dans un effet : la
 * largeur est une donnée externe à React, la lire ainsi évite le rendu
 * intermédiaire que provoque un `setState` dans un effet.
 */
export const useWindowWidth = (): number | undefined =>
  useSyncExternalStore(subscribe, getSnapshot, () => undefined);
