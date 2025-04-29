import { useSyncExternalStore } from 'react';

/**
 * Renvoi un booléen qui indique si le navigateur est online
 *
 * Le changement d'état est détecté et provoque un re-render du composant
 * qui utilise le hook.
 *
 * Ref: https://react.dev/reference/react/useSyncExternalStore#subscribing-to-a-browser-api
 */
export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getSnapshot() {
  return navigator.onLine;
}

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

// évite une erreur avec nextjs
// Ref: https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering
function getServerSnapshot() {
  return true; // Always show "Online" for server-generated HTML
}
