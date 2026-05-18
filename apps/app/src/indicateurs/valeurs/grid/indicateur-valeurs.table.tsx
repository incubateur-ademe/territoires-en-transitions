'use client';

import { JSX } from 'react';
import { GridProvider } from './grid-context';
import { GridFrame } from './grid-frame';
import { normalizeGridInput } from './grid-model';
import {
  CellKey,
  GridCell,
  GridInput,
  IndicateurValuesGridActions,
  NotifyGridEvent,
  Year,
} from './types';

export type IndicateurValuesGridProps = {
  rows: GridInput;
  years: Year[];
  referenceYear?: Year;
  /** Nom de l’indicateur principal affiché en haut à gauche de la grille. */
  title: string;
  unit: string;
  cells: Map<CellKey, GridCell>;
  isLoading?: boolean;
  actions: IndicateurValuesGridActions;
  notify: NotifyGridEvent;
  onReferenceYearChange?: (year: Year) => void;
  onAddYear?: (year: Year) => void;
  onRemoveYear?: (year: Year) => void;
  canRemoveYear?: (year: Year) => boolean;
};

export const IndicateurValeursTable = ({
  rows,
  years,
  referenceYear,
  title,
  unit,
  cells,
  isLoading = false,
  actions,
  notify,
  onReferenceYearChange,
  onAddYear,
  onRemoveYear,
  canRemoveYear,
}: IndicateurValuesGridProps): JSX.Element => {
  const { groups, isGrouped } = normalizeGridInput(rows);
  return (
    <GridProvider
      groups={groups}
      isGrouped={isGrouped}
      years={years}
      referenceYear={referenceYear ?? null}
      title={title}
      unit={unit}
      cells={cells}
      isLoading={isLoading}
      actions={actions}
      notify={notify}
      onReferenceYearChange={onReferenceYearChange}
      onAddYear={onAddYear}
      onRemoveYear={onRemoveYear}
      canRemoveYear={canRemoveYear}
    >
      <GridFrame />
    </GridProvider>
  );
};
