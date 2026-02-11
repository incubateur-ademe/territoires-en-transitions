import { Select, TableCell } from '@tet/ui';
import { Controller } from 'react-hook-form';
import { getYearsOptions } from '../../utils';
import { useNoteForm } from './note-form.context';

export const NoteYearCell = () => {
  const { form, submitNote, isReadonly } = useNoteForm();
  const { yearsOptions } = getYearsOptions(20);

  const value = form.watch('year');

  return (
    <TableCell
      className="font-bold text-primary-9 text-sm align-top"
      canEdit={!isReadonly}
      edit={{
        onClose: submitNote,
        renderOnEdit: ({ openState }) => (
          <Controller
            control={form.control}
            name="year"
            render={({ field: { onChange, value: fieldValue } }) => (
              <Select
                options={yearsOptions}
                values={fieldValue}
                onChange={(selectedYear) => {
                  if (selectedYear) {
                    onChange(selectedYear as number);
                    openState.setIsOpen(false);
                  }
                }}
                openState={openState}
                displayOptionsWithoutFloater
              />
            )}
          />
        ),
      }}
    >
      {value}
    </TableCell>
  );
};
