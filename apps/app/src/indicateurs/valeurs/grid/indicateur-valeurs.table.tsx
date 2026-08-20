'use client';

import { JSX } from 'react';
import type { ReferencesVariant } from './cell-references';
import { GridProvider } from './grid-context';
import { GridFrame } from './grid-frame';
import { normalizeGridInput } from './grid-model';
import {
  CellKey,
  GridCell,
  GridInput,
  GridMaxHeight,
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
  /** Grille consultable : cellules en champs désactivés, collage inerte. */
  isReadonly?: boolean;
  /**
   * Plafond de hauteur, et donc zone de défilement interne dans laquelle
   * l'en-tête et les lignes de secteur restent collantes.
   */
  maxHeight?: GridMaxHeight;
  actions: IndicateurValuesGridActions;
  notify: NotifyGridEvent;
  onReferenceYearChange?: (year: Year) => void;
  onAddYear?: (year: Year) => void;
  onRemoveYear?: (year: Year) => void;
  canRemoveYear?: (year: Year) => boolean;
  /**
   * Présentation des constats des sources extérieures. `compact` par défaut :
   * un coin replié par cellule, sans hauteur ajoutée.
   */
  referencesVariant?: ReferencesVariant;
};

export const IndicateurValeursTable = ({
  rows,
  years,
  referenceYear,
  title,
  unit,
  cells,
  isLoading = false,
  isReadonly = false,
  maxHeight = 'compact',
  actions,
  notify,
  onReferenceYearChange,
  onAddYear,
  onRemoveYear,
  canRemoveYear,
  referencesVariant = 'compact',
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
      isReadonly={isReadonly}
      maxHeight={maxHeight}
      actions={actions}
      notify={notify}
      onReferenceYearChange={onReferenceYearChange}
      onAddYear={onAddYear}
      onRemoveYear={onRemoveYear}
      canRemoveYear={canRemoveYear}
      referencesVariant={referencesVariant}
    >
      <GridFrame />
    </GridProvider>
  );
};
