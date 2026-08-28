import { Row } from '@tanstack/react-table';
import { JSX } from 'react';
import { IndicateurValeursTableRow } from './indicateur-valeurs.table-row';
import { IndicateurTableRow } from './types';

export const IndicateurValeursTableBody = ({
  rows,
}: {
  rows: Row<IndicateurTableRow>[];
}): JSX.Element => (
  <tbody>
    {rows.map((row) => (
      <IndicateurValeursTableRow key={row.id} row={row} />
    ))}
  </tbody>
);
