import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';
import { useNoteForm } from './note-form.context';
import { NoteDeletionModal } from './note-deletion.modal';

type Props = {
  fiche: FicheWithRelations;
  onDeleteNote: (noteId: number) => Promise<void>;
};

export const NoteActionsCell = ({ fiche, onDeleteNote }: Props) => {
  const { note } = useNoteForm();

  return (
    <TableCell className="py-0">
      <NoteDeletionModal
        fiche={fiche}
        editedNote={note}
        onDelete={onDeleteNote}
      />
    </TableCell>
  );
};
