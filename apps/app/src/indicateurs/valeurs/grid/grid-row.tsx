import { flexRender, Row } from '@tanstack/react-table';
import { TableRow } from '@tet/ui';
import { Fragment, JSX } from 'react';
import { GridDisplayRow } from './grid-model';

export const IndicateurValeursRow = ({
  row,
}: {
  row: Row<GridDisplayRow>;
}): JSX.Element => (
  <TableRow className="last:border-b">
    {row.getVisibleCells().map((cell) => (
      <Fragment key={cell.id}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </Fragment>
    ))}
  </TableRow>
);
