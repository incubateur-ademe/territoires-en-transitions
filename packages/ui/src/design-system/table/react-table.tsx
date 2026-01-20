import { flexRender, Table as TableProps } from '@tanstack/react-table';
import { Fragment } from 'react';

import { EmptyCardProps } from '../../components/EmptyCard/EmptyCard';

import { Table } from './table';
import { TableEmpty } from './table.empty';
import { TableHead } from './table.head';
import { TableLoading, TableLoadingProps } from './table.loading';
import { TableRow } from './table.row';

export type ReactTableProps = {
  table: TableProps<any>;
  isLoading?: boolean; // Pour afficher uniquement des loading rows
  isLoadingNewRow?: boolean; // Pour afficher un loading row en plus des rows existants
  nbLoadingRows?: TableLoadingProps['nbOfRows'];
  isEmpty?: boolean;
  emptyCard?: EmptyCardProps;
};

export const ReactTable = ({
  table,
  isLoading,
  isLoadingNewRow,
  isEmpty,
  emptyCard,
  nbLoadingRows,
}: ReactTableProps) => {
  return (
    <Table>
      <TableHead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <Fragment key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </Fragment>
            ))}
          </tr>
        ))}
      </TableHead>
      <tbody>
        {isLoading ? (
          <TableLoading
            columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
            nbOfRows={nbLoadingRows}
          />
        ) : isEmpty ? (
          <TableEmpty
            columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
            description="Aucune donnée disponible"
            {...emptyCard}
          />
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="text-sm">
              {row.getVisibleCells().map((cell) => (
                <Fragment key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Fragment>
              ))}
            </TableRow>
          ))
        )}
        {isLoadingNewRow && (
          <TableLoading
            columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
            nbOfRows={1}
          />
        )}
      </tbody>
    </Table>
  );
};
