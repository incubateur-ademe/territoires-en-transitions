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
   * Saisine que l'URL désigne, sur la route d'un dossier d'instruction. Doit
   * porter la même valeur que les autres appels de `getCollectivite` de la même
   * requête : celui-ci mémoïse par arguments, et l'omettre ici rendrait au store
   * — donc à la bannière — la saisine la plus récente au lieu de celle du
   * dossier ouvert.
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
