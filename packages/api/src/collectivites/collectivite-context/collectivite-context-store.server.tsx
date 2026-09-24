import 'server-only';

import { ReactNode } from 'react';
import { getCollectivite } from '../get-collectivite.server';
import { CollectiviteProviderStoreClient } from './collectivite-context-store.client';

export const CollectiviteProviderStore = async ({
  collectiviteId,
  demandeAvisId,
  demarcheId,
  children,
}: {
  collectiviteId: number;
  /**
   * Saisine désignée par l'URL d'un dossier. L'omettre rendrait au store — donc
   * à la bannière — la saisine la plus récente au lieu de celle du dossier ouvert.
   */
  demandeAvisId?: number;
  /** Démarche désignée par l'URL d'un dépôt en élaboration, sans saisine. */
  demarcheId?: number;
  children: ReactNode;
}) => {
  const collectivite = await getCollectivite(
    collectiviteId,
    demandeAvisId,
    demarcheId
  );

  return (
    <CollectiviteProviderStoreClient collectivite={collectivite}>
      {children}
    </CollectiviteProviderStoreClient>
  );
};
