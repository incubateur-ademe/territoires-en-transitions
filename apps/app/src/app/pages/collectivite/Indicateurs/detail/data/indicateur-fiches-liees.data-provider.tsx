'use client';

import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useCollectiviteId } from '@tet/api/collectivites';
import type { PropsWithChildren } from 'react';
import { IndicateurFichesLieesProvider } from '../context/indicateur-fiches-liees.context';

const useListFichesLiees = (indicateurId: number) => {
  const collectiviteId = useCollectiviteId();
  return useListFiches(collectiviteId, {
    filters: { indicateurIds: [indicateurId] },
  }).fiches;
};

const FICHES_LIEES_VALUE = { useListFichesLiees };

export const IndicateurFichesLieesDataProvider = ({
  children,
}: PropsWithChildren) => (
  <IndicateurFichesLieesProvider value={FICHES_LIEES_VALUE}>
    {children}
  </IndicateurFichesLieesProvider>
);
