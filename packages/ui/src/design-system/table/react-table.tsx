import {
  columnVisibilityFeature,
  FlexRender,
  Row,
  RowData,
  Table as TableProps,
  TableFeatures,
} from '@tanstack/react-table';
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

/**
 * Les tableaux rendus ici doivent enregistrer `columnVisibilityFeature` : seules
 * les cellules et colonnes visibles sont affichées.
 */
type VisibilityFeatures = {
  columnVisibilityFeature: typeof columnVisibilityFeature;
};

export type ReactTableFeatures = TableFeatures & VisibilityFeatures;

export type ReactTableProps<
  TFeatures extends ReactTableFeatures,
  T extends RowData
> = {
  table: TableProps<TFeatures, T>;
  isLoading?: boolean; // Pour afficher uniquement des loading rows
  isLoadingNewRow?: boolean; // Pour afficher un loading row en plus des rows existants
  nbLoadingRows?: TableLoadingProps['nbOfRows'];
  isEmpty?: boolean;
  emptyCard?: EmptyCardProps;
  rowWrapper?: (props: {
    row: Row<TFeatures, T>;
    children: ReactNode;
  }) => ReactNode;
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
  getRowProps?: (row: Row<TFeatures, T>) => TableRowAttributes;
};

export const ReactTable = <
  TFeatures extends ReactTableFeatures,
  T extends RowData
>({
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
}: ReactTableProps<TFeatures, T>) => {
  // TS ne résout pas `Row<TFeatures, T>` ni `Table<TFeatures, T>` pour un
  // `TFeatures` générique : on les lit à travers la seule feature requise.
  const visibleColumnIds = (
    table as unknown as TableProps<VisibilityFeatures, T>
  )
    .getVisibleFlatColumns()
    .map((col) => col.id);

  const renderRow = (row: Row<TFeatures, T>) => {
    const cells = (row as unknown as Row<VisibilityFeatures, T>)
      .getVisibleCells()
      .map((cell) => <FlexRender key={cell.id} cell={cell} />);
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
              <FlexRender key={header.id} header={header} />
            ))}
          </tr>
        ))}
      </TableHead>
      <tbody>
        {isLoading ? (
          <TableLoading columnIds={visibleColumnIds} nbOfRows={nbLoadingRows} />
        ) : isEmpty ? (
          <TableEmpty columnIds={visibleColumnIds} {...emptyCard} />
        ) : (
          table.getRowModel().rows.map(renderRow)
        )}
        {isLoadingNewRow && (
          <TableLoading columnIds={visibleColumnIds} nbOfRows={1} />
        )}
      </tbody>
    </Table>
  );
};
