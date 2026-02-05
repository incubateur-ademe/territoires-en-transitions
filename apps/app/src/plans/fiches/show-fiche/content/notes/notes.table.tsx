import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';

import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { TableHeaderCell } from '@tet/ui';
import { NoteActionsCell } from './note.actions.cell';
import { NoteDescriptionCell } from './note.description.cell';
import { NoteMetadataCell } from './note.metadata.cell';
import { NoteYearCell } from './note.year.cell';
import { NoteDeSuiviPicto } from './notes.picto';
import { NotesReactTable } from './notes-react-table';

type NotesTableProps = {
  notes: FicheNote[];
  fiche: FicheWithRelations;
  isReadonly: boolean;
  isLoading?: boolean;
  onCreateNote: () => Promise<void>;
  onUpsertNote: (editedNote: {
    id?: number;
    note: string;
    dateNote: number;
  }) => Promise<void>;
  onDeleteNote: (noteToDeleteId: number) => Promise<void>;
};

const columnHelper = createColumnHelper<FicheNote>();

export const NotesTable = ({
  notes,
  fiche,
  isReadonly,
  isLoading,
  onCreateNote,
  onUpsertNote,
  onDeleteNote,
}: NotesTableProps) => {
  const [columnVisibility, setColumnVisibility] = useState({});

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.dateNote).getTime() - new Date(a.dateNote).getTime()
      ),
    [notes]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('dateNote', {
        header: () => <TableHeaderCell title="Année" className="w-32" />,
        cell: () => <NoteYearCell />,
      }),
      columnHelper.accessor('note', {
        header: () => <TableHeaderCell title="Description" />,
        cell: () => <NoteDescriptionCell />,
      }),
      columnHelper.display({
        id: 'metadata',
        header: () => <TableHeaderCell title="Auteur/Date" className="w-64" />,
        cell: () => <NoteMetadataCell />,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <TableHeaderCell className="w-16" icon="more-2-line" />,
        cell: () => (
          <NoteActionsCell fiche={fiche} onDeleteNote={onDeleteNote} />
        ),
      }),
    ],
    [fiche, onDeleteNote]
  );

  const table = useReactTable({
    columns,
    data: sortedNotes,
    getRowId: (row, index) => row.id?.toString() ?? `new-${index}`,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    table.getColumn('actions')?.toggleVisibility(!isReadonly);
  }, [isReadonly, table]);

  const isEmpty = sortedNotes.length === 0;

  return (
    <div className="p-2 bg-white rounded-lg border border-grey-3">
      <div className="max-2xl:overflow-x-auto">
        <NotesReactTable
          table={table}
          isReadonly={isReadonly}
          isLoading={isLoading}
          isEmpty={isEmpty}
          onUpsertNote={onUpsertNote}
          emptyCard={{
            picto: (props) => <NoteDeSuiviPicto {...props} />,
            title: 'Aucune note de suivi pour le moment',
            description:
              "Ajoutez des notes pour documenter le suivi et l'avancement de votre fiche action.",
            actions:
              isReadonly || !onCreateNote
                ? undefined
                : [
                    {
                      onClick: onCreateNote,
                      children: 'Ajouter une note',
                      icon: 'add-line',
                    },
                  ],
          }}
        />
      </div>
    </div>
  );
};
