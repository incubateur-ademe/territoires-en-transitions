'use client';

import { Button } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { IndicateurId, OpenDataSource, Year } from '../types';
import { ColumnSelection } from './open-data-picker';
import { OpenDataSelector } from './open-data-selector';

type CoverageDotProps = {
  coveringSources: OpenDataSource[];
  groupLabel: string;
  rowLabel: string;
  indicateurId: IndicateurId;
  year: Year;
  columnSelection?: ColumnSelection;
};

export const CoverageDot = ({
  coveringSources,
  groupLabel,
  rowLabel,
  indicateurId,
  year,
  columnSelection,
}: CoverageDotProps): JSX.Element => (
  <OpenDataSelector
    groupLabel={groupLabel}
    rowLabel={rowLabel}
    indicateurId={indicateurId}
    year={year}
    sources={coveringSources}
    columnSelection={columnSelection}
  >
    <Button
      variant="unstyled"
      aria-label={appLabels.indicateurValeurOpenDataDisponible}
      className="absolute right-0.5 top-0.5 flex items-center justify-center p-1"
    >
      <span className="h-2 w-2 rounded-full bg-success-1 ring-2 ring-success-2" />
    </Button>
  </OpenDataSelector>
);
