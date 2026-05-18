import { flexRender, Table } from '@tanstack/react-table';
import { TableHead, TableRow } from '@tet/ui';
import { Fragment, JSX } from 'react';
import { GridDisplayRow } from './grid-model';

type GridHeadProps = {
  table: Table<GridDisplayRow>;
};

export const GridHead = ({ table }: GridHeadProps): JSX.Element => (
  <TableHead className="z-40">
    {/* Top header row only; render placeholders too (rowLabel / addYear). */}
    {table.getHeaderGroups().slice(0, 1).map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <Fragment key={header.id}>
            {flexRender(
              header.column.columnDef.header,
              header.getContext()
            )}
          </Fragment>
        ))}
      </TableRow>
    ))}
  </TableHead>
);
