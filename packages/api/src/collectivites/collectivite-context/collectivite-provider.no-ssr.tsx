'use client';

import dynamic from 'next/dynamic';
import { useContext } from 'react';
import { CurrentCollectivite } from '../fetch-current-collectivite';
import { CollectiviteContext } from './collectivite-context';

export const CollectiviteProvider = dynamic(
  () =>
    import('./collectivite-context').then(
      (mod) => mod.CollectiviteProvider_OnlyImportWithoutSSR
    ),
  { ssr: false }
);

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
    throw new Error(
      'useCollectiviteId must be used within a CollectiviteProvider'
    );
  }
  return context.collectiviteId;
}

export function useCurrentCollectivite(): CurrentCollectivite {
  const context = useCollectiviteContext();
  if (!context.collectivite) {
    throw new Error(
      'useCurrentCollectivite must be used within a CollectiviteProvider'
    );
  }
  return context.collectivite;
}
