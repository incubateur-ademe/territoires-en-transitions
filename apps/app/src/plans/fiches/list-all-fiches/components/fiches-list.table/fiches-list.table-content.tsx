import { flexRender, Table } from '@tanstack/react-table';

import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { TableEmpty, TableLoading, TableRow } from '@/ui';

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
    return (
      <TableLoading
        columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
      />
    );
  }

  if (isEmpty) {
    return (
      <TableEmpty
        columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
        title="Aucune action ne correspond à votre recherche"
        picto={(props) => <PictoExpert {...props} />}
      />
    );
  }

  return table.getRowModel().rows.map((row) => (
    <TableRow key={row.id} className="text-sm">
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-4 py-3">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </TableRow>
  ));
};
