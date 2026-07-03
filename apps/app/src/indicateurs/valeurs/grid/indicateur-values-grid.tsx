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
  Year,
} from './types';

export type IndicateurValuesGridProps = {
  rows: GridInput;
  years: Year[];
  referenceYear?: Year;
  unit?: string;
  cells: Map<CellKey, GridCell>;
  isLoading?: boolean;
  actions: IndicateurValuesGridActions;
  notify?: (message: string) => void;
  onReorderRows?: (groupId: string, activeId: string, overId: string) => void;
  onReferenceYearChange?: (year: Year) => void;
};

export const IndicateurValuesGrid = ({
  rows,
  years,
  referenceYear,
  unit,
  cells,
  isLoading = false,
  actions,
  notify,
  onReorderRows,
  onReferenceYearChange,
}: IndicateurValuesGridProps): JSX.Element => {
  const { groups, isGrouped } = normalizeGridInput(rows);
  return (
    <GridProvider
      groups={groups}
      isGrouped={isGrouped}
      years={years}
      referenceYear={referenceYear ?? null}
      unit={unit ?? null}
      cells={cells}
      isLoading={isLoading}
      actions={actions}
      notify={notify}
      onReorderRows={onReorderRows}
      onReferenceYearChange={onReferenceYearChange}
    >
      <div className="rounded-xl border border-grey-3 bg-white p-4">
        <GridFrame />
      </div>
    </GridProvider>
  );
};
