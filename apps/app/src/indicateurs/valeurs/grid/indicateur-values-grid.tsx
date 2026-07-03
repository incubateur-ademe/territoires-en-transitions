'use client';

import { JSX } from 'react';
import { IndicateurChoicesSnapshot } from './choices-snapshot';
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
import { useChoicesSnapshot } from './use-choices-snapshot';

export type IndicateurValuesGridProps = {
  rows: GridInput;
  years: Year[];
  referenceYear?: Year;
  unit?: string;
  cells: Map<CellKey, GridCell>;
  isLoading?: boolean;
  isReadonly?: boolean;
  actions: IndicateurValuesGridActions;
  notify?: (message: string) => void;
  onReorderRows?: (groupId: string, activeId: string, overId: string) => void;
  onReferenceYearChange?: (year: Year) => void;
  onSnapshotChange?: (snapshot: IndicateurChoicesSnapshot) => void;
};

export const IndicateurValuesGrid = ({
  rows,
  years,
  referenceYear,
  unit,
  cells,
  isLoading = false,
  isReadonly = false,
  actions,
  notify,
  onReorderRows,
  onReferenceYearChange,
  onSnapshotChange,
}: IndicateurValuesGridProps): JSX.Element => {
  const { groups, isGrouped } = normalizeGridInput(rows);
  const isReorderable = onReorderRows !== undefined;
  useChoicesSnapshot(cells, onSnapshotChange);
  return (
    <GridProvider
      groups={groups}
      isGrouped={isGrouped}
      years={years}
      referenceYear={referenceYear ?? null}
      unit={unit ?? null}
      cells={cells}
      isLoading={isLoading}
      isReadonly={isReadonly}
      isReorderable={isReorderable}
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
