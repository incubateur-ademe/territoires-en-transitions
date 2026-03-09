import { RichTextEditor, TableCell } from '@tet/ui';
import { useNoteForm } from './note-form.context';

export const NoteDescriptionCell = () => {
  const { form, submitNote, isReadonly } = useNoteForm();

  const value = form.watch('description');

  return (
    <TableCell className="text-primary-9 align-top">
      <RichTextEditor
        unstyled
        initialValue={value}
        onChange={(html) => form.setValue('description', html)}
        onBlur={submitNote}
        disabled={isReadonly}
      />
    </TableCell>
  );
};
