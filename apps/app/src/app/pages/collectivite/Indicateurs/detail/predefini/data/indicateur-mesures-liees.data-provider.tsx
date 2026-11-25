'use client';

import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import type { PropsWithChildren } from 'react';
import {
  IndicateurMesuresLieesProvider,
  type MesuresLieesResult,
} from '../context/indicateur-mesures-liees.context';

const useListMesuresLiees = (mesuresIds: string[]): MesuresLieesResult => {
  const hasMesures = mesuresIds.length > 0;
  const { data, isPending } = useListActions(
    { actionIds: mesuresIds },
    { enabled: hasMesures }
  );
  return { mesures: data, isLoading: hasMesures && isPending };
};

const MESURES_LIEES_VALUE = { useListMesuresLiees };

export const IndicateurMesuresLieesDataProvider = ({
  children,
}: PropsWithChildren) => (
  <IndicateurMesuresLieesProvider value={MESURES_LIEES_VALUE}>
    {children}
  </IndicateurMesuresLieesProvider>
);
