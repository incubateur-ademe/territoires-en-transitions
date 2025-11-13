import 'server-only';

import { ReactNode } from 'react';
import { getCollectivite } from '../get-collectivite.server';
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
