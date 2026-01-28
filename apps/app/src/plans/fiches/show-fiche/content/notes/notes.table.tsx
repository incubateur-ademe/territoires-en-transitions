import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { Button, cn, Spacer, VisibleWhen } from '@tet/ui';
import { useState } from 'react';
import { NoteRow } from './editable-note-row';
import { NoteTableNewRow } from './note-table-new-row';

type NotesTableProps = {
  notes: FicheNote[];
  fiche: FicheWithRelations;
  isReadonly: boolean;
  onUpsertNote: (editedNote: {
    id?: number;
    note: string;
    dateNote: number;
  }) => Promise<void>;
  onDeleteNote: (noteToDeleteId: number) => Promise<void>;
};

const HeaderCell = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <th
      className={cn(
        'text-left uppercase text-sm text-grey-9 font-medium py-3 pl-4 white border-b border-gray-4',
        className
      )}
    >
      {children}
    </th>
  );
};

export const NotesTable = ({
  notes,
  fiche,
  isReadonly,
  onUpsertNote,
  onDeleteNote,
}: NotesTableProps) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.dateNote).getTime() - new Date(a.dateNote).getTime()
  );
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-0 border border-gray-3 bg-grey-1 rounded-lg overflow-hidden [&_tbody_tr:nth-child(even)]:bg-grey-2">
          <thead>
            <tr className="border-b border-gray-300">
              <HeaderCell className="w-[125px]">Année</HeaderCell>
              <HeaderCell className="w-[400px]">Description</HeaderCell>
              <HeaderCell className="w-[300px]">Auteur/Date</HeaderCell>
              <HeaderCell className="w-[80px]" />
            </tr>
          </thead>
          <tbody>
            {sortedNotes.map((note) => (
              <NoteRow
                key={note.id || 'new'}
                note={note}
                isReadonly={isReadonly}
                fiche={fiche}
                onUpsertNote={onUpsertNote}
                onDeleteNote={onDeleteNote}
              />
            ))}
            <VisibleWhen condition={!isReadonly && isAddingNote}>
              <NoteTableNewRow
                key="new"
                onUpsertNote={onUpsertNote}
                onCancel={() => setIsAddingNote(false)}
              />
            </VisibleWhen>
          </tbody>
        </table>
      </div>
      <Spacer height={1} />
      <Button
        size="xs"
        icon="add-line"
        variant="outlined"
        onClick={() => setIsAddingNote((prev) => !prev)}
      >
        Ajouter une note
      </Button>
    </div>
  );
};
