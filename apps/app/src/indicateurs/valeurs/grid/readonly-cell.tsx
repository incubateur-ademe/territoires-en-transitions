import { JSX, memo } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { GridCellProps } from './cell-props';
import {
  ValueWithVariation,
  variationHintId,
} from './variation/variation-hint';
import { SourceBadge } from './source-badge';
import { generateCellKey, GridCell } from './types';

type ReadonlyCellProps = GridCellProps & {
  cell: GridCell;
};

export const ReadonlyCell = memo(
  ({
    cell,
    polluant,
    indicateurId,
    year,
    variationToReferenceYear,
  }: ReadonlyCellProps): JSX.Element => {
    const cellId = generateCellKey(indicateurId, year);
    const impactId = variationHintId(cellId, variationToReferenceYear);
    if (cell.kind === 'open-data') {
      return (
        <div
          aria-label={appLabels.indicateurCelluleOpenData({
            rowLabel: polluant,
            year,
            value: cell.value,
            source: cell.source.libelle,
          })}
          aria-describedby={impactId}
          className="flex h-full w-full items-center gap-2 bg-success-2 px-3 text-sm"
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
        </div>
      );
    }
    return (
      <div
        aria-label={appLabels.indicateurCellule(polluant, year)}
        aria-describedby={impactId}
        className="flex h-full items-center justify-end pr-3 text-sm text-grey-8"
      >
        <ValueWithVariation
          variationToReferenceYear={variationToReferenceYear}
          hintId={impactId}
        >
          <span>{cell.value ?? ''}</span>
        </ValueWithVariation>
      </div>
    );
  }
);

ReadonlyCell.displayName = 'ReadonlyCell';
