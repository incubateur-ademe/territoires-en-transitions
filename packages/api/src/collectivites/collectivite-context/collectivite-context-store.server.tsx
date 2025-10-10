import 'server-only';

import { getCollectivite } from '@/api/collectivites/get-collectivite.server';
import { ReactNode } from 'react';
import { CollectiviteProviderStoreClient } from './collectivite-context-store.client';

export const CollectiviteProviderStore = async ({
  collectiviteId,
  children,
}: {
  collectiviteId: number;
  children: ReactNode;
}) => {
  const collectivite = await getCollectivite(collectiviteId);

  return (
    <CollectiviteProviderStoreClient collectivite={collectivite}>
      {children}
    </CollectiviteProviderStoreClient>
  );
};
