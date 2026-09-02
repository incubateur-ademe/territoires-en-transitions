import 'server-only';

import { ReactNode } from 'react';
import { getCollectivite } from '../get-collectivite.server';
import { CollectiviteProviderStoreClient } from './collectivite-context-store.client';

export const CollectiviteProviderStore = async ({
  collectiviteId,
  demandeAvisId,
  children,
}: {
  collectiviteId: number;
  /**
   * Saisine désignée par l'URL d'un dossier. L'omettre rendrait au store — donc
   * à la bannière — la saisine la plus récente au lieu de celle du dossier ouvert.
   */
  demandeAvisId?: number;
  children: ReactNode;
}) => {
  const collectivite = await getCollectivite(collectiviteId, demandeAvisId);

  return (
    <CollectiviteProviderStoreClient collectivite={collectivite}>
      {children}
    </CollectiviteProviderStoreClient>
  );
};
