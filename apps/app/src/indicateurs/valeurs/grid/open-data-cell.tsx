'use client';

import { JSX, memo } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { GridCellProps } from './cell-props';
import {
  ValueWithVariation,
  variationHintId,
} from './variation/variation-hint';
import { OpenDataSelector } from './open-data-picker/open-data-selector';
import { SourceBadge } from './source-badge';
import { generateCellKey, GridCell } from './types';

type OpenDataCellProps = GridCellProps & {
  cell: Extract<GridCell, { kind: 'open-data' }>;
};

export const OpenDataCell = memo(
  ({
    cell,
    groupLabel,
    rowLabel,
    indicateurId,
    year,
    columnSelection,
    variationToReferenceYear,
  }: OpenDataCellProps): JSX.Element => {
    const cellId = generateCellKey(indicateurId, year);
    const impactId = variationHintId(cellId, variationToReferenceYear);
    return (
      <OpenDataSelector
        groupLabel={groupLabel}
        rowLabel={rowLabel}
        indicateurId={indicateurId}
        year={year}
        sources={cell.coveringSources}
        selectedSourceId={cell.selectedSourceId}
        columnSelection={columnSelection}
      >
        <button
          type="button"
          data-cell-id={cellId}
          aria-label={appLabels.indicateurCelluleOpenData({
            rowLabel,
            year,
            value: cell.value,
            source: cell.source.libelle,
          })}
          aria-describedby={impactId}
          className="flex h-full w-full items-center gap-2 bg-success-2 px-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-primary-5"
        >
          <span className="shrink-0">
            <SourceBadge source={cell.source} />
          </span>
          <ValueWithVariation
            variationToReferenceYear={variationToReferenceYear}
            hintId={impactId}
            className="ml-auto"
          >
            <span className="text-success-1">{cell.value}</span>
          </ValueWithVariation>
        </button>
      </OpenDataSelector>
    );
  }
);

OpenDataCell.displayName = 'OpenDataCell';
