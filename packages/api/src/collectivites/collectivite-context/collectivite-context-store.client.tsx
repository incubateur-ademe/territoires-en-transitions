'use client';

import { ReactNode, useEffect } from 'react';
import { CurrentCollectivite } from '../fetch-current-collectivite';
import { useCollectiviteContext } from './collectivite-provider.no-ssr';

export const CollectiviteProviderStoreClient = ({
  children,
  collectivite: newCollectivite,
}: {
  children: ReactNode;
  collectivite: CurrentCollectivite;
}) => {
  const { collectivite: storedCollectivite, storeCollectivite } =
    useCollectiviteContext();

  useEffect(() => {
    if (newCollectivite.collectiviteId !== storedCollectivite?.collectiviteId) {
      storeCollectivite(newCollectivite);
    }
  }, [newCollectivite, storedCollectivite, storeCollectivite]);

  return children;
};
