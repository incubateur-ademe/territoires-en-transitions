'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';

export type IndicateurChartValue = {
  chartInfo: IndicateurChartInfo;
};

const IndicateurChartContext = createContext<IndicateurChartValue | null>(null);

export const IndicateurChartProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurChartValue }>) => (
  <IndicateurChartContext.Provider value={value}>
    {children}
  </IndicateurChartContext.Provider>
);

export const useIndicateurChart = (): IndicateurChartValue => {
  const context = useContext(IndicateurChartContext);
  if (!context) {
    throw new Error(
      'useIndicateurChart must be used within an IndicateurChartProvider'
    );
  }
  return context;
};
