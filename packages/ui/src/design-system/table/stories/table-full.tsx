import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Badge } from '../../Badge';
import { Checkbox } from '../../Checkbox';
import { TableHeaderCell } from '../index';
import { ReactTable } from '../react-table';
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
      <Checkbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  columnHelper.accessor('title', {
    header: () => <TableHeaderCell title="Titre" />,
    cell: (info) => <div className="line-clamp-2">{info.getValue()}</div>,
  }),
  columnHelper.accessor('description', {
    header: () => <TableHeaderCell title="Description" />,
    cell: (info) => <div className="line-clamp-2">{info.getValue()}</div>,
  }),
  columnHelper.accessor('statut', {
    header: (header) => (
      <TableHeaderCell
        className="w-32"
        sortFn={() => header.column.toggleSorting()}
        title="Statut"
      />
    ),
    cell: (info) =>
      info.getValue() ? (
        <Badge state="info" title={info.getValue()} size="sm" />
      ) : (
        <span className="italic text-sm text-grey-6">
          Sélectionner un statut
        </span>
      ),
  }),
  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell className="w-32" title="Pilotes" />,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dateDeFin', {
    header: (header) => (
      <TableHeaderCell
        className="w-32"
        sortFn={() => header.column.toggleSorting()}
        title="Date de fin"
      />
    ),
    cell: (info) => info.getValue(),
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

  return <ReactTable table={table} isLoading={isLoading} isEmpty={isEmpty} />;
};
