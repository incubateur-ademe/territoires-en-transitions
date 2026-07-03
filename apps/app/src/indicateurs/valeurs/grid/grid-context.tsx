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
  isGrouped: boolean;
  years: Year[];
  referenceYear: Year | null;
  unit: string | null;
  cells: Map<CellKey, GridCell>;
  isLoading: boolean;
  isReorderable: boolean;
  actions: IndicateurValuesGridActions;
  notify: (message: string) => void;
  onReorderRows?: (groupId: string, activeId: string, overId: string) => void;
  onReferenceYearChange?: (year: Year) => void;
};

const GridContext = createContext<GridContextValue | null>(null);

export type GridCellServices = {
  saveCellValue: IndicateurValuesGridActions['saveCellValue'];
  selectOpenData: IndicateurValuesGridActions['selectOpenData'];
  clearCell: IndicateurValuesGridActions['clearCell'];
  unit: string | null;
  notify: (message: string) => void;
};

const GridCellServicesContext = createContext<GridCellServices | null>(null);

export const GridCellServicesProvider = ({
  services,
  children,
}: {
  services: GridCellServices;
  children: ReactNode;
}): JSX.Element => (
  <GridCellServicesContext.Provider value={services}>
    {children}
  </GridCellServicesContext.Provider>
);

export const useGridCellServices = (): GridCellServices => {
  const services = use(GridCellServicesContext);
  if (services === null) {
    throw new Error(
      'useGridCellServices must be used within a <GridProvider>'
    );
  }
  return services;
};

export const GridProvider = ({
  children,
  groups,
  isGrouped,
  years,
  referenceYear,
  unit,
  cells,
  isLoading,
  isReorderable,
  actions,
  notify,
  onReorderRows,
  onReferenceYearChange,
}: GridContextValue & { children: ReactNode }): JSX.Element => {
  const value = useMemo<GridContextValue>(
    () => ({
      groups,
      isGrouped,
      years,
      referenceYear,
      unit,
      cells,
      isLoading,
      isReorderable,
      actions,
      notify,
      onReorderRows,
      onReferenceYearChange,
    }),
    [
      groups,
      isGrouped,
      years,
      referenceYear,
      unit,
      cells,
      isLoading,
      isReorderable,
      actions,
      notify,
      onReorderRows,
      onReferenceYearChange,
    ]
  );
  const cellServices = useMemo<GridCellServices>(
    () => ({
      saveCellValue: actions.saveCellValue,
      selectOpenData: actions.selectOpenData,
      clearCell: actions.clearCell,
      unit,
      notify,
    }),
    [
      actions.saveCellValue,
      actions.selectOpenData,
      actions.clearCell,
      unit,
      notify,
    ]
  );
  return (
    <GridContext.Provider value={value}>
      <GridCellServicesProvider services={cellServices}>
        {children}
      </GridCellServicesProvider>
    </GridContext.Provider>
  );
};

export const useGridContext = (): GridContextValue => {
  const context = use(GridContext);
  if (context === null) {
    throw new Error('useGridContext must be used within a <GridProvider>');
  }
  return context;
};
