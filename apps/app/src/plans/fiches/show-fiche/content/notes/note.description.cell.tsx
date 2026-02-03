import { RichTextEditor, TableCell } from '@tet/ui';
import { htmlToText } from 'html-to-text';
import { useNoteForm } from './note-form.context';

export const NoteDescriptionCell = () => {
  const { form, submitNote, isReadonly } = useNoteForm();

  const value = form.watch('description');

  if (isReadonly) {
    return (
      <TableCell className="text-primary-9 align-top">
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: value }} />
      </TableCell>
    );
  }

  return (
    <TableCell className="text-primary-9 align-top">
      <RichTextEditor
        unstyled
        initialValue={htmlToText(value)}
        onChange={(html) => form.setValue('description', html)}
        onBlur={submitNote}
      />
    </TableCell>
  );
};
