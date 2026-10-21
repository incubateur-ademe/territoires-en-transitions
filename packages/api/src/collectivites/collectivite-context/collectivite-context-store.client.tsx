'use client';

import { isEqual } from 'es-toolkit';
import { ReactNode, useEffect } from 'react';
import { useCollectiviteContext } from './collectivite-provider.no-ssr';
import { CollectiviteWithContexteInstruction } from './type';

export const CollectiviteProviderStoreClient = ({
  children,
  collectivite: newCollectivite,
}: {
  children: ReactNode;
  collectivite: CollectiviteWithContexteInstruction;
}) => {
  const { collectivite, setCollectivite } = useCollectiviteContext();

  useEffect(() => {
    if (!isEqual(newCollectivite, collectivite)) {
      setCollectivite(newCollectivite);
    }
  }, [newCollectivite, collectivite, setCollectivite]);

  // Les enfants utilisent useCurrentCollectivite : attendre que le contexte
  // corresponde à la collectivité et au dossier d'instruction de l'URL.
  return collectivite?.collectiviteId === newCollectivite.collectiviteId &&
    isEqual(
      collectivite.contexteInstruction,
      newCollectivite.contexteInstruction
    )
    ? children
    : null;
};
