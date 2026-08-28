import { flexRender, Table } from '@tanstack/react-table';
import { TableHead, TableRow } from '@tet/ui';
import { Fragment, JSX } from 'react';
import { IndicateurTableRow } from './types';

type Props = {
  table: Table<IndicateurTableRow>;
};

export const IndicateurValeursTableHead = ({ table }: Props): JSX.Element => (
  <TableHead className="z-40">
    {/* Top header row only; render placeholders too (rowLabel / addYear). */}
    {table
      .getHeaderGroups()
      .slice(0, 1)
      .map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <Fragment key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </Fragment>
          ))}
        </TableRow>
      ))}
  </TableHead>
);
