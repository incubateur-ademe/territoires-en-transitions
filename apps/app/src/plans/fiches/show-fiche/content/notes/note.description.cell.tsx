import { RichTextEditor, TableCell } from '@tet/ui';
import { useNoteForm } from './note-form.context';

export const NoteDescriptionCell = () => {
  const { form, submitNote, isReadonly, note } = useNoteForm();

  return (
    <TableCell className="text-primary-9 align-top">
      <RichTextEditor
        unstyled
        // Reload only persisted content; feeding the draft back resets the caret.
        initialValue={note.note}
        onChange={(html) => form.setValue('description', html)}
        onBlurTextChanged={submitNote}
        disabled={isReadonly}
      />
    </TableCell>
  );
};
