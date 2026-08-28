import { flexRender, Row } from '@tanstack/react-table';
import { TableRow } from '@tet/ui';
import { Fragment, JSX } from 'react';
import { IndicateurTableRow } from './types';

export const IndicateurValeursTableRow = ({
  row,
}: {
  row: Row<IndicateurTableRow>;
}): JSX.Element => (
  <TableRow className="last:border-b">
    {row.getVisibleCells().map((cell) => (
      <Fragment key={cell.id}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </Fragment>
    ))}
  </TableRow>
);
