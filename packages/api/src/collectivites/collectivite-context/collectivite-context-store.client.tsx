'use client';

import { CollectiviteAccess } from '@/domain/users';
import { ReactNode, useEffect } from 'react';
import { useCollectiviteContext } from './collectivite-provider.no-ssr';

export const CollectiviteProviderStoreClient = ({
  children,
  collectivite: newCollectivite,
}: {
  children: ReactNode;
  collectivite: CollectiviteAccess;
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
