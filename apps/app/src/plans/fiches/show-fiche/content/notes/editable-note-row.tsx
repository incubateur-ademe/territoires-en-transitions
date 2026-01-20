import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { Select, TableCell, TableCellTextarea, VisibleWhen } from '@tet/ui';
import { htmlToText } from 'html-to-text';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { getYearsOptions } from '../../utils';
import { MetadataNoteView } from './metadata-note.view';
import { NoteDeletionModal } from './note-deletion.modal';

const noteFormSchema = z.object({
  year: z
    .number({
      error: "L'année est requise",
    })
    .min(1990, "L'année doit être supérieure ou égale à 1990")
    .max(
      new Date().getFullYear() + 10,
      "L'année ne peut pas être dans plus de 10 ans"
    ),
  description: z.string().min(1, 'La description est requise'),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

type EditableNoteRowProps = {
  note: FicheNote | { dateNote: string; note: string };
  fiche: FicheWithRelations;
  isReadonly: boolean;
  onUpsertNote: (editedNote: {
    id?: number;
    note: string;
    dateNote: number;
  }) => Promise<void>;
  onDeleteNote: (noteToDeleteId: number) => Promise<void>;
};

const useNoteRowForm = ({
  initialYear,
  initialDescription,
}: {
  initialYear: number;
  initialDescription: string;
}) => {
  const form = useForm<NoteFormValues>({
    resolver: standardSchemaResolver(noteFormSchema),
    defaultValues: { year: initialYear, description: initialDescription },
  });

  React.useEffect(() => {
    form.reset({ year: initialYear, description: initialDescription });
  }, [initialYear, initialDescription, form]);

  return form;
};

const isValidNote = (note: EditableNoteRowProps['note']): note is FicheNote => {
  return 'id' in note && note.id !== undefined;
};

export const NoteRow = ({
  note,
  fiche,
  isReadonly,
  onUpsertNote,
  onDeleteNote,
}: EditableNoteRowProps) => {
  const initialYear = new Date(note.dateNote).getFullYear();
  const initialDescription = htmlToText(note.note);

  const { yearsOptions } = getYearsOptions();
  const { control, handleSubmit, watch, reset } = useNoteRowForm({
    initialYear,
    initialDescription,
  });

  const currentRowValue = watch();
  const isNewNote = !isValidNote(note);
  const onSubmit = async (data: NoteFormValues) => {
    const hasChanges =
      data.description !== initialDescription || data.year !== initialYear;

    if (!hasChanges) return;

    await onUpsertNote({
      id: isNewNote ? undefined : note.id,
      dateNote: data.year,
      note: data.description,
    });

    if (isNewNote) reset();
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 group">
      <TableCell
        className="font-bold text-primary-9 text-sm border-b border-gray-5"
        canEdit={!isReadonly}
        edit={{
          renderOnEdit: ({ openState }) => (
            <Controller
              control={control}
              name="year"
              render={({ field: { onChange, value } }) => (
                <Select
                  options={yearsOptions}
                  values={value}
                  onChange={(selectedYear) => {
                    if (selectedYear) {
                      onChange(selectedYear as number);
                      handleSubmit(onSubmit)();
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
        {currentRowValue.year}
      </TableCell>
      <TableCell
        className="text-primary-9 border-b border-gray-5"
        canEdit={!isReadonly}
        onClose={() => {
          handleSubmit(onSubmit)();
        }}
        edit={{
          renderOnEdit: ({ openState }) => (
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TableCellTextarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  closeEditing={() => {
                    handleSubmit(onSubmit)();
                    openState.setIsOpen(false);
                  }}
                  placeholder="Saisir une description"
                />
              )}
            />
          ),
        }}
      >
        {currentRowValue.description.trim().length > 0 ? (
          <span className="line-clamp-2">{currentRowValue.description}</span>
        ) : (
          <span className="italic text-grey-6">Saisir une description</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-primary-10 align-top border-b border-gray-5">
        {!isNewNote && <MetadataNoteView note={note} />}
      </TableCell>
      <VisibleWhen condition={!isReadonly}>
        <TableCell className="text-right border-b border-gray-5">
          {!isNewNote && (
            <div className="invisible group-hover:visible">
              <NoteDeletionModal
                fiche={fiche}
                editedNote={note}
                onDelete={onDeleteNote}
              />
            </div>
          )}
        </TableCell>
      </VisibleWhen>
    </tr>
  );
};
