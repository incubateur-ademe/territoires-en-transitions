import { RichTextEditor, TableCell } from '@tet/ui';
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
        initialValue={value}
        onChange={(html) => form.setValue('description', html)}
        onBlur={submitNote}
        actions={
          /*
           * actions are limited to these 3 for now
           * to hide issues with color picker, link and block type action
           * buttons not working in table cell
           * */
          ['bold', 'italic', 'underline']
        }
      />
    </TableCell>
  );
};
