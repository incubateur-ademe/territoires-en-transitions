'use client';

import { createContext, JSX, ReactNode, use, useMemo } from 'react';
import {
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurValuesGridActions,
  Year,
} from './types';

export type GridContextValue = {
  groups: GridRowGroup[];
  years: Year[];
  referenceYear: Year | null;
  unit: string | null;
  cells: Map<CellKey, GridCell>;
  isLoading: boolean;
  actions: IndicateurValuesGridActions;
};

const GridContext = createContext<GridContextValue | null>(null);

export const GridProvider = ({
  children,
  groups,
  years,
  referenceYear,
  unit,
  cells,
  isLoading,
  actions,
}: GridContextValue & { children: ReactNode }): JSX.Element => {
  const value = useMemo<GridContextValue>(
    () => ({ groups, years, referenceYear, unit, cells, isLoading, actions }),
    [groups, years, referenceYear, unit, cells, isLoading, actions]
  );
  return <GridContext.Provider value={value}>{children}</GridContext.Provider>;
};

export const useGridContext = (): GridContextValue => {
  const context = use(GridContext);
  if (context === null) {
    throw new Error('useGridContext must be used within a <GridProvider>');
  }
  return context;
};
