import { flexRender, Table as TableProps } from '@tanstack/react-table';
import { Fragment } from 'react';

import { FicheNote } from '@tet/domain/plans';
import {
  EmptyCardProps,
  Table,
  TableHead,
  TableRow,
  TableEmpty,
  TableLoading,
} from '@tet/ui';
import { NoteFormProvider } from './note-form.context';

type NotesReactTableProps = {
  table: TableProps<FicheNote>;
  isReadonly: boolean;
  isLoading?: boolean;
  isLoadingNewRow?: boolean;
  isEmpty?: boolean;
  emptyCard?: EmptyCardProps;
  onUpsertNote: (editedNote: {
    id?: number;
    note: string;
    dateNote: number;
  }) => Promise<void>;
};

export const NotesReactTable = ({
  table,
  isReadonly,
  isLoading,
  isLoadingNewRow,
  isEmpty,
  emptyCard,
  onUpsertNote,
}: NotesReactTableProps) => {
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
          />
        ) : isEmpty ? (
          <TableEmpty
            columnIds={table.getVisibleFlatColumns().map((col) => col.id)}
            description="Aucune donnée disponible"
            {...emptyCard}
          />
        ) : (
          table.getRowModel().rows.map((row) => (
            <NoteFormProvider
              key={row.id}
              note={row.original}
              isReadonly={isReadonly}
              onUpsertNote={onUpsertNote}
            >
              <TableRow className="text-sm">
                {row.getVisibleCells().map((cell) => (
                  <Fragment key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Fragment>
                ))}
              </TableRow>
            </NoteFormProvider>
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
