import { flexRender, Row, Table as TableProps } from '@tanstack/react-table';
import { Fragment, HTMLAttributes, ReactNode } from 'react';

import { EmptyCardProps } from '../../components/EmptyCard/EmptyCard';

import { Table } from './table';
import { TableEmpty } from './table.empty';
import { TableHead } from './table.head';
import { TableLoading, TableLoadingProps } from './table.loading';
import { TableRow } from './table.row';

/**
 * Les attributs d'une ligne. Les `data-*` sont admis explicitement : un objet
 * typé `HTMLAttributes` les refuse, là où JSX les laisse passer.
 */
export type TableRowAttributes = HTMLAttributes<HTMLTableRowElement> & {
  [attribute: `data-${string}`]: string | undefined;
};

export type ReactTableProps<T = unknown> = {
  table: TableProps<T>;
  isLoading?: boolean; // Pour afficher uniquement des loading rows
  isLoadingNewRow?: boolean; // Pour afficher un loading row en plus des rows existants
  nbLoadingRows?: TableLoadingProps['nbOfRows'];
  isEmpty?: boolean;
  emptyCard?: EmptyCardProps;
  rowWrapper?: (props: { row: Row<T>; children: ReactNode }) => ReactNode;
  /**
   * Le nom accessible du tableau. À renseigner dès qu'une page en porte
   * plusieurs, ou qu'aucun titre voisin ne dit ce que celui-ci liste.
   */
  ariaLabel?: string;
  className?: string;
  /**
   * Les attributs à poser sur chaque ligne — un `data-test`, une classe
   * conditionnelle. Pour remplacer la ligne elle-même, voir `rowWrapper`.
   */
  getRowProps?: (row: Row<T>) => TableRowAttributes;
};

export const ReactTable = <T,>({
  table,
  isLoading,
  isLoadingNewRow,
  isEmpty,
  emptyCard,
  nbLoadingRows,
  rowWrapper,
  ariaLabel,
  className,
  getRowProps,
}: ReactTableProps<T>) => {
  const renderRow = (row: Row<T>) => {
    const cells = row
      .getVisibleCells()
      .map((cell) => (
        <Fragment key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Fragment>
      ));
    if (rowWrapper) {
      return (
        <Fragment key={row.id}>
          {rowWrapper({ row, children: <>{cells}</> })}
        </Fragment>
      );
    }
    return (
      <TableRow key={row.id} className="text-sm" {...getRowProps?.(row)}>
        {cells}
      </TableRow>
    );
  };

  return (
    <Table aria-label={ariaLabel} className={className}>
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
            {...emptyCard}
          />
        ) : (
          table.getRowModel().rows.map(renderRow)
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
