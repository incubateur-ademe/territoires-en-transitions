import { flexRender, Table } from '@tanstack/react-table';

import { Row, TableEmpty, TableLoading } from './components';

type Props = {
  isLoading: boolean;
  isEmpty: boolean;
  table: Table<any>;
};

export const FichesListTableContent = ({
  isLoading,
  isEmpty,
  table,
}: Props) => {
  if (isLoading) {
    <TableLoading
      columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
    />;
  }

  if (isEmpty) {
    <TableEmpty
      columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
      title="Aucune action ne correspond à votre recherche"
    />;
  }

  return table.getRowModel().rows.map((row) => (
    <Row key={row.id} className="text-sm">
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-4 py-3">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </Row>
  ));
};
