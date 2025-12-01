'use client';

import { CollectiviteAccess } from '@tet/domain/users';
import { ReactNode, useEffect } from 'react';
import { useCollectiviteContext } from './collectivite-provider.no-ssr';

export const CollectiviteProviderStoreClient = ({
  children,
  collectivite: newCollectivite,
}: {
  children: ReactNode;
  collectivite: CollectiviteAccess;
}) => {
  const { collectivite, setCollectivite } = useCollectiviteContext();

  useEffect(() => {
    if (newCollectivite.collectiviteId !== collectivite?.collectiviteId) {
      setCollectivite(newCollectivite);
    }
  }, [newCollectivite, collectivite, setCollectivite]);

  return children;
};
