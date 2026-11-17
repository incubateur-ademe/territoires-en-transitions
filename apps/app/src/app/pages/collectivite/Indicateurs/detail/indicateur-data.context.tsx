'use client';

import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { createContext, type PropsWithChildren, useContext } from 'react';

export type IndicateurDataValue = {
  indicateur: IndicateurDetaille;
  canMutateIndicateur: boolean;
  canMutateValeur: boolean;
};

const IndicateurDataContext = createContext<IndicateurDataValue | null>(null);

export const IndicateurDataProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurDataValue }>) => (
  <IndicateurDataContext.Provider value={value}>
    {children}
  </IndicateurDataContext.Provider>
);

export const useIndicateurData = (): IndicateurDataValue => {
  const context = useContext(IndicateurDataContext);
  if (!context) {
    throw new Error(
      'useIndicateurData must be used within an IndicateurDataProvider'
    );
  }
  return context;
};
