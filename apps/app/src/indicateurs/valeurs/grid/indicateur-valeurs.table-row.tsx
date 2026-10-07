import { FlexRender, Row } from '@tanstack/react-table';
import { TableRow } from '@tet/ui';
import { JSX } from 'react';
import { IndicateurTableRow } from './types';
import { IndicateurValeursTableFeatures } from './utils';

export const IndicateurValeursTableRow = ({
  row,
}: {
  row: Row<IndicateurValeursTableFeatures, IndicateurTableRow>;
}): JSX.Element => (
  <TableRow className="last:border-b">
    {row.getAllCells().map((cell) => (
      <FlexRender key={cell.id} cell={cell} />
    ))}
  </TableRow>
);
