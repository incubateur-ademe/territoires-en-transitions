'use client';

import dynamic from 'next/dynamic';
import { useContext } from 'react';
import { CollectiviteContext } from './collectivite-context';
import { CollectiviteCurrent } from './type';

export const CollectiviteProvider = dynamic(
  () =>
    import('./collectivite-context').then(
      (mod) => mod.CollectiviteProvider_OnlyImportWithoutSSR
    ),
  { ssr: false }
);

/** À utiliser lorsque la collectivité peut être null */
export function useCollectiviteContext() {
  const context = useContext(CollectiviteContext);
  if (!context) {
    throw new Error(
      'useCollectivite must be used within a CollectiviteProvider'
    );
  }
  return context;
}

export function useCollectiviteId(): number {
  const context = useCollectiviteContext();
  if (!context.collectiviteId) {
    throw new Error('collectiviteId is not defined yet');
  }
  return context.collectiviteId;
}

/**
 * Collectivité courante si elle est connue, `undefined` sinon, y compris hors
 * d'un `CollectiviteProvider` : pour le code partagé entre pages avec et sans
 * collectivité.
 */
export function useOptionalCollectiviteId(): number | undefined {
  return useContext(CollectiviteContext)?.collectiviteId;
}

/** À utiliser lorsque la collectivité est garantie */
export function useCurrentCollectivite(): CollectiviteCurrent {
  const context = useCollectiviteContext();
  if (!context.collectivite) {
    throw new Error('currentCollectivite is not defined yet');
  }
  return context.collectivite;
}
