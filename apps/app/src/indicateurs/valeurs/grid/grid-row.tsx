import { flexRender, Row } from '@tanstack/react-table';
import { TableCell } from '@tet/ui';
import { Fragment, JSX } from 'react';
import { GridDisplayRow } from './grid-model';
import { RowHeader } from './row-header';

export const GridRow = ({
  row,
  showAddYearColumn = false,
}: {
  row: Row<GridDisplayRow>;
  showAddYearColumn?: boolean;
}): JSX.Element => (
  <tr role="row">
    <RowHeader label={row.original.rowLabel} />
    {row.getVisibleCells().map((cell) => {
      return (
        <Fragment key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Fragment>
      );
    })}
    {showAddYearColumn && (
      <TableCell
        className="sticky right-0 z-10 h-10 bg-white p-0"
        aria-hidden
      />
    )}
  </tr>
);
