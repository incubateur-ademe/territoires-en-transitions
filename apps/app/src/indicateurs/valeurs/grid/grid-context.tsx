'use client';

import { createContext, JSX, ReactNode, use, useMemo } from 'react';
import type { ReferencesVariant } from './cell-references';
import {
  CellKey,
  GridCell,
  GridMaxHeight,
  GridRowGroup,
  IndicateurValuesGridActions,
  NotifyGridEvent,
  Year,
} from './types';

export type GridContextValue = {
  groups: GridRowGroup[];
  isGrouped: boolean;
  years: Year[];
  title: string;
  unit: string;
  cells: Map<CellKey, GridCell>;
  isLoading: boolean;
  /**
   * Grille consultable mais non saisissable : les cellules restent visibles,
   * sous forme de champs désactivés, et le collage est inerte.
   */
  isReadonly?: boolean;
  /**
   * Plafond de hauteur, et donc zone de défilement interne dans laquelle
   * l'en-tête et les lignes de secteur restent collantes.
   */
  maxHeight?: GridMaxHeight;
  actions: IndicateurValuesGridActions;
  notify: NotifyGridEvent;
  onAddYear?: (year: Year) => void;
  onRemoveYear?: (year: Year) => void;
  canRemoveYear?: (year: Year) => boolean;
  /**
   * Présentation des constats des sources extérieures : `compact` replie un coin
   * de cellule, `list` les empile sous la valeur.
   */
  referencesVariant?: ReferencesVariant;
};

const GridContext = createContext<GridContextValue | null>(null);

export type GridCellServices = {
  saveCellValue: IndicateurValuesGridActions['saveCellValue'];
  unit: string | null;
  notify: NotifyGridEvent;
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
    throw new Error('useGridCellServices must be used within a <GridProvider>');
  }
  return services;
};

export const GridProvider = ({
  children,
  groups,
  isGrouped,
  years,
  title,
  unit,
  cells,
  isLoading,
  isReadonly = false,
  maxHeight = 'compact',
  actions,
  notify,
  onAddYear,
  onRemoveYear,
  canRemoveYear,
  referencesVariant = 'compact',
}: GridContextValue & { children: ReactNode }): JSX.Element => {
  const value = useMemo<GridContextValue>(
    () => ({
      groups,
      isGrouped,
      years,
      title,
      unit,
      cells,
      isLoading,
      isReadonly,
      maxHeight,
      actions,
      notify,
      onAddYear,
      onRemoveYear,
      canRemoveYear,
      referencesVariant,
    }),
    [
      groups,
      isGrouped,
      years,
      title,
      unit,
      cells,
      isLoading,
      isReadonly,
      maxHeight,
      actions,
      notify,
      onAddYear,
      onRemoveYear,
      canRemoveYear,
      referencesVariant,
    ]
  );
  const cellServices = useMemo<GridCellServices>(
    () => ({
      saveCellValue: actions.saveCellValue,
      unit,
      notify,
    }),
    [actions.saveCellValue, unit, notify]
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
