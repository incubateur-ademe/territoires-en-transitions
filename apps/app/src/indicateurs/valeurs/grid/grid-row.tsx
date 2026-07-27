import { flexRender, Row } from '@tanstack/react-table';
import { cn } from '@tet/ui';
import { JSX } from 'react';
import { GridDisplayRow } from './grid-model';
import { RowHeader } from './row-header';
import { ValeurField } from './types';

type ValueColumnMeta = {
  field?: ValeurField;
};

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
      const field = (cell.column.columnDef.meta as ValueColumnMeta | undefined)
        ?.field;
      return (
        <td
          key={cell.id}
          role="gridcell"
          className={cn(
            'whitespace-nowrap p-0',
            field === 'resultat' && 'border-r-0'
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      );
    })}
    {showAddYearColumn && (
      <td className="sticky right-0 z-10 h-10 bg-white p-0" aria-hidden />
    )}
  </tr>
);
