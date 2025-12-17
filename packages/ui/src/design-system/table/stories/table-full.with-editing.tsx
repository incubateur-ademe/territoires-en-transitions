import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Badge } from '../../Badge';
import { Select } from '../../Select';
import { ReactTable } from '../react-table';
import { TableCell } from '../table.cell';
import { TableCellTextarea } from '../table.cell-textarea';
import { TableHeaderCell } from '../table.header-cell';
import {
  fakeStatusOptions,
  FakeVueTabulaireAction,
  fakeVueTabulaireData,
} from './fixtures';

const columnHelper = createColumnHelper<FakeVueTabulaireAction>();

const columns = [
  columnHelper.accessor('description', {
    header: () => <TableHeaderCell title="Description" />,
    cell: (info) => {
      const [value, setValue] = useState(info.cell.getValue());

      return (
        <TableCell
          canEdit
          edit={{
            renderOnEdit: ({ openState }) => (
              <TableCellTextarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                closeEditing={() => openState.setIsOpen(false)}
                placeholder="Renseigner la description"
              />
            ),
          }}
        >
          {value && value.trim().length > 0 ? (
            <span className="line-clamp-2">{value}</span>
          ) : (
            <span className="italic text-grey-6">
              Renseigner la description
            </span>
          )}
        </TableCell>
      );
    },
  }),
  columnHelper.accessor('statut', {
    header: (header) => (
      <TableHeaderCell
        className="w-40"
        sortFn={() => header.column.toggleSorting()}
        title="Statut"
      />
    ),
    cell: () => {
      const [value, setValue] = useState(fakeStatusOptions[0].value);

      return (
        <TableCell
          canEdit
          edit={{
            renderOnEdit: ({ openState }) => (
              <div className="w-80">
                <Select
                  options={fakeStatusOptions}
                  values={value}
                  onChange={(v: any) => setValue(v)}
                  openState={openState}
                  displayOptionsWithoutFloater
                />
              </div>
            ),
          }}
        >
          {value ? (
            <Badge
              state="info"
              title={
                fakeStatusOptions.find((option) => option.value === value)
                  ?.label
              }
              size="sm"
            />
          ) : (
            <span className="italic text-sm text-grey-6">
              Sélectionner un statut
            </span>
          )}
        </TableCell>
      );
    },
  }),
  columnHelper.accessor('pilotes', {
    header: () => <TableHeaderCell className="w-56" title="Pilotes" />,
    cell: (info) => <TableCell>{info.getValue()}</TableCell>,
  }),
  columnHelper.accessor('dateDeFin', {
    header: (header) => (
      <TableHeaderCell
        className="w-40"
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

export const TableFullEditing = ({ isLoading, isEmpty }: Props) => {
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
