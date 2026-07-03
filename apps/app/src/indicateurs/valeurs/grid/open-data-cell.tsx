'use client';

import { JSX, memo } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { ColumnSelection } from './open-data-picker/open-data-picker';
import { OpenDataSelector } from './open-data-picker/open-data-selector';
import { SourceBadge } from './source-badge';
import { generateCellKey, GridCell, IndicateurId, Year } from './types';

type OpenDataCellProps = {
  cell: Extract<GridCell, { kind: 'open-data' }>;
  secteur: string;
  polluant: string;
  indicateurId: IndicateurId;
  year: Year;
  columnSelection?: ColumnSelection;
};

export const OpenDataCell = memo(
  ({
    cell,
    secteur,
    polluant,
    indicateurId,
    year,
    columnSelection,
  }: OpenDataCellProps): JSX.Element => (
    <OpenDataSelector
      secteur={secteur}
      polluant={polluant}
      indicateurId={indicateurId}
      year={year}
      sources={cell.coveringSources}
      selectedSourceId={cell.selectedSourceId}
      columnSelection={columnSelection}
    >
      <button
        type="button"
        data-cell-id={generateCellKey(indicateurId, year)}
        aria-label={appLabels.indicateurCelluleOpenData({
          rowLabel: polluant,
          year,
          value: cell.value,
          source: cell.source.libelle,
        })}
        className="flex h-full w-full items-center justify-between gap-1 bg-success-2 px-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-primary-5"
      >
        <SourceBadge source={cell.source} />
        <span className="text-success-1">{cell.value}</span>
      </button>
    </OpenDataSelector>
  )
);

OpenDataCell.displayName = 'OpenDataCell';
