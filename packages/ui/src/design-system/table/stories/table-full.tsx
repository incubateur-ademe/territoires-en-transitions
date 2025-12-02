import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Badge } from '../../Badge';
import { Checkbox } from '../../Checkbox';
import {
  Table,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableLoading,
  TableRow,
} from '../index';
import { FakeVueTabulaireAction, fakeVueTabulaireData } from './fixtures';

const columnHelper = createColumnHelper<FakeVueTabulaireAction>();

const columns = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <TableHeaderCell className="w-14">
        <Checkbox
          className="m-auto"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      </TableHeaderCell>
    ),
    cell: ({ row }) => (
      <TableCell>
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      </TableCell>
    ),
  }),
  columnHelper.accessor('title', {
    header: () => <TableHeaderCell title="Titre" />,
    cell: (info) => (
      <TableCell>
        <div className="line-clamp-2">{info.getValue()}</div>
      </TableCell>
    ),
  }),
  columnHelper.accessor('description', {
    header: () => <TableHeaderCell title="Description" />,
    cell: (info) => (
      <TableCell>
        <div className="line-clamp-2">{info.getValue()}</div>
      </TableCell>
    ),
  }),
  columnHelper.accessor('statut', {
    header: (header) => (
      <TableHeaderCell
        className="w-32"
        sortFn={() => header.column.toggleSorting()}
        title="Statut"
      />
    ),
    cell: (info) => (
      <TableCell>
        {info.getValue() ? (
          <Badge state="info" title={info.getValue()} size="sm" />
        ) : (
          <span className="italic text-sm text-grey-6">
            Sélectionner un statut
          </span>
        )}
      </TableCell>
    ),
  }),
  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell className="w-32" title="Pilotes" />,
    cell: (info) => <TableCell>{info.getValue()}</TableCell>,
  }),
  columnHelper.accessor('dateDeFin', {
    header: (header) => (
      <TableHeaderCell
        className="w-32"
        sortFn={() => header.column.toggleSorting()}
        title="Date de fin"
      />
    ),
    cell: (info) => <TableCell>{info.getValue()}</TableCell>,
  }),
];

type Props = {
  isLoading?: boolean;
  isEmpty?: boolean;
};

export const TableFull = ({ isLoading, isEmpty }: Props) => {
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    columns,
    data: fakeVueTabulaireData,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Table>
      <TableHead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) =>
              flexRender(header.column.columnDef.header, header.getContext())
            )}
          </tr>
        ))}
      </TableHead>
      <tbody>
        {isLoading ? (
          <TableLoading
            columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
          />
        ) : isEmpty ? (
          <TableEmpty
            columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
            description="Aucune donnée disponible"
          />
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="text-sm">
              {row
                .getVisibleCells()
                .map((cell) =>
                  flexRender(cell.column.columnDef.cell, cell.getContext())
                )}
            </TableRow>
          ))
        )}
      </tbody>
    </Table>
  );
};
