'use client';

import type { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { createContext, type PropsWithChildren, useContext } from 'react';

type IndicateurFichesLieesValue = {
  fiches: FicheListItem[];
};

const IndicateurFichesLieesContext =
  createContext<IndicateurFichesLieesValue | null>(null);

export const IndicateurFichesLieesProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurFichesLieesValue }>) => (
  <IndicateurFichesLieesContext.Provider value={value}>
    {children}
  </IndicateurFichesLieesContext.Provider>
);

export const useIndicateurFichesLiees = (): IndicateurFichesLieesValue => {
  const context = useContext(IndicateurFichesLieesContext);
  if (!context) {
    throw new Error(
      'useIndicateurFichesLiees must be used within an IndicateurFichesLieesProvider'
    );
  }
  return context;
};
