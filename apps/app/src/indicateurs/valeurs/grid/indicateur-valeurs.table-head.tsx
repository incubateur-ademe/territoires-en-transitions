import { FlexRender, Table } from '@tanstack/react-table';
import { TableHead, TableRow } from '@tet/ui';
import { JSX } from 'react';
import { IndicateurTableRow } from './types';
import { IndicateurValeursTableFeatures } from './utils';

type Props = {
  table: Table<IndicateurValeursTableFeatures, IndicateurTableRow>;
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
            <FlexRender key={header.id} header={header} />
          ))}
        </TableRow>
      ))}
  </TableHead>
);
