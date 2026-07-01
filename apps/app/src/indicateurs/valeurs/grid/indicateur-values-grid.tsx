'use client';

import { JSX } from 'react';
import { GridProvider } from './grid-context';
import { GridFrame } from './grid-frame';
import {
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurValuesGridActions,
  Year,
} from './types';

export type IndicateurValuesGridProps = {
  groups: GridRowGroup[];
  years: Year[];
  referenceYear?: Year;
  unit?: string;
  cells: Map<CellKey, GridCell>;
  isLoading?: boolean;
  actions: IndicateurValuesGridActions;
};

export const IndicateurValuesGrid = ({
  groups,
  years,
  referenceYear,
  unit,
  cells,
  isLoading = false,
  actions,
}: IndicateurValuesGridProps): JSX.Element => (
  <GridProvider
    groups={groups}
    years={years}
    referenceYear={referenceYear ?? null}
    unit={unit ?? null}
    cells={cells}
    isLoading={isLoading}
    actions={actions}
  >
    <div className="rounded-xl border border-grey-3 bg-white p-4">
      <GridFrame />
    </div>
  </GridProvider>
);
