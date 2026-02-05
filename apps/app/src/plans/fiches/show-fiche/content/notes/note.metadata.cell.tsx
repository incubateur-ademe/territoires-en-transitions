import { TableCell } from '@tet/ui';
import { MetadataNoteView } from './metadata-note.view';
import { useNoteForm } from './note-form.context';

export const NoteMetadataCell = () => {
  const { note } = useNoteForm();

  return (
    <TableCell className="text-sm text-primary-10 align-top">
      <MetadataNoteView note={note} />
    </TableCell>
  );
};
