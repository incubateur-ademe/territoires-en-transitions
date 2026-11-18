'use client';

import type { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { createContext, type PropsWithChildren, useContext } from 'react';

export type MesuresLieesResult = {
  mesures: ActionListItem[];
  isLoading: boolean;
};

type IndicateurMesuresLieesValue = {
  useListMesuresLiees: (mesuresIds: string[]) => MesuresLieesResult;
};

const IndicateurMesuresLieesContext =
  createContext<IndicateurMesuresLieesValue | null>(null);

export const IndicateurMesuresLieesProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurMesuresLieesValue }>) => (
  <IndicateurMesuresLieesContext.Provider value={value}>
    {children}
  </IndicateurMesuresLieesContext.Provider>
);

export const useIndicateurMesuresLiees = (): IndicateurMesuresLieesValue => {
  const context = useContext(IndicateurMesuresLieesContext);
  if (!context) {
    throw new Error(
      'useIndicateurMesuresLiees must be used within an IndicateurMesuresLieesProvider'
    );
  }
  return context;
};
