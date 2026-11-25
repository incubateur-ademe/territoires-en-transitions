'use client';

import type { SousIndicateursChartState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-chart-state.rules';
import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
} from 'react';

export type IndicateurSousIndicateursChartValue = {
  useSousIndicateursChart: (indicateurId: number) => SousIndicateursChartState;
};

const IndicateurSousIndicateursChartContext =
  createContext<IndicateurSousIndicateursChartValue | null>(null);

export const IndicateurSousIndicateursChartProvider = ({
  value,
  children,
}: PropsWithChildren<{
  value: IndicateurSousIndicateursChartValue;
}>): JSX.Element => (
  <IndicateurSousIndicateursChartContext.Provider value={value}>
    {children}
  </IndicateurSousIndicateursChartContext.Provider>
);

export const useIndicateurSousIndicateursChart =
  (): IndicateurSousIndicateursChartValue => {
    const context = useContext(IndicateurSousIndicateursChartContext);
    if (!context) {
      throw new Error(
        'useIndicateurSousIndicateursChart must be used within an IndicateurSousIndicateursChartProvider'
      );
    }
    return context;
  };
