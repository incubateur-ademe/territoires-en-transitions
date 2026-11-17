'use client';

import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { createContext, type PropsWithChildren, useContext } from 'react';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';

export type IndicateurDataValue = {
  indicateur: IndicateurDetaille;
  chartInfo: IndicateurChartInfo;
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
