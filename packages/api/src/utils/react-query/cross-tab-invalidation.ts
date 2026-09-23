import type { QueryClient, QueryKey } from '@tanstack/react-query';

const CHANNEL_NAME = 'tet-cross-tab-query-invalidation';

type InvalidationMessage = {
  queryKeys: QueryKey[];
};

// Un seul `BroadcastChannel`, partagé par cet onglet pour l'émission ET
// l'écoute. `BroadcastChannel` n'exclut de la réception que l'instance qui a
// émis le message (pas les autres instances ouvertes dans le même onglet) :
// en réutilisant le même objet pour les deux usages, cet onglet ne peut donc
// jamais recevoir son propre message.
let channel: BroadcastChannel | null | undefined;

function getChannel(): BroadcastChannel | null {
  if (channel === undefined) {
    channel =
      typeof window === 'undefined' || typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

/**
 * Prévient les autres onglets ouverts sur la même origine qu'ils doivent
 * invalider ces requêtes : utilisé quand le backend recalcule une donnée
 * (ex : le score d'un référentiel) suite à une mutation faite dans cet
 * onglet, sans qu'on sache si d'autres onglets affichent cette donnée.
 */
export function broadcastQueryInvalidation(queryKeys: QueryKey[]) {
  getChannel()?.postMessage({ queryKeys } satisfies InvalidationMessage);
}

/**
 * À monter une fois à la racine de l'app : invalide dans ce `queryClient`
 * les requêtes signalées par `broadcastQueryInvalidation` depuis un autre
 * onglet. Ne déclenche pas de refetch à intervalle régulier : uniquement en
 * réaction à un événement précis.
 */
export function listenForCrossTabQueryInvalidation(
  queryClient: QueryClient
): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  ch.onmessage = (event: MessageEvent<InvalidationMessage>) => {
    event.data.queryKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  };

  return () => {
    ch.onmessage = null;
  };
}
