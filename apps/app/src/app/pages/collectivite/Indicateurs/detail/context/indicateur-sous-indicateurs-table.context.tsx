'use client';

import type { SousIndicateursTableState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table-state.rules';
import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
} from 'react';

export type IndicateurSousIndicateursTableValue = {
  useSousIndicateursTable: (indicateurId: number) => SousIndicateursTableState;
};

const IndicateurSousIndicateursTableContext =
  createContext<IndicateurSousIndicateursTableValue | null>(null);

export const IndicateurSousIndicateursTableProvider = ({
  value,
  children,
}: PropsWithChildren<{
  value: IndicateurSousIndicateursTableValue;
}>): JSX.Element => (
  <IndicateurSousIndicateursTableContext.Provider value={value}>
    {children}
  </IndicateurSousIndicateursTableContext.Provider>
);

export const useIndicateurSousIndicateursTable =
  (): IndicateurSousIndicateursTableValue => {
    const context = useContext(IndicateurSousIndicateursTableContext);
    if (!context) {
      throw new Error(
        'useIndicateurSousIndicateursTable must be used within an IndicateurSousIndicateursTableProvider'
      );
    }
    return context;
  };
