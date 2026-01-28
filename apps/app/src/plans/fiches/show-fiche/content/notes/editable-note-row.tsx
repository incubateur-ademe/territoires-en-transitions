import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import {
  RichTextEditor,
  Select,
  TableCell,
  TableRow,
  VisibleWhen,
} from '@tet/ui';
import { htmlToText } from 'html-to-text';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { getYearsOptions } from '../../utils';
import { MetadataNoteView } from './metadata-note.view';
import { NoteDeletionModal } from './note-deletion.modal';

const noteFormSchema = z.object({
  id: z.number(),
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
  note: FicheNote;
  fiche: FicheWithRelations;
  isReadonly: boolean;
  onUpsertNote: (editedNote: {
    id?: number;
    note: string;
    dateNote: number;
  }) => Promise<void>;
  onDeleteNote: (noteToDeleteId: number) => Promise<void>;
};

export const NoteRow = ({
  note,
  fiche,
  isReadonly,
  onUpsertNote,
  onDeleteNote,
}: EditableNoteRowProps) => {
  const { yearsOptions } = getYearsOptions();
  const { control, handleSubmit, watch, setValue } = useForm<NoteFormValues>({
    resolver: standardSchemaResolver(noteFormSchema),
    defaultValues: {
      id: note.id,
      year: new Date(note.dateNote).getFullYear(),
      description: htmlToText(note.note),
    },
  });

  const submitNote = React.useCallback(async () => {
    await handleSubmit(async (data) => {
      await onUpsertNote({
        id: note.id,
        dateNote: data.year,
        note: data.description,
      });
    })();
  }, [handleSubmit, onUpsertNote, note.id]);

  return (
    <TableRow className="border-b border-gray-200 hover:bg-gray-50 group">
      <TableCell
        className="font-bold text-primary-9 text-sm border-b border-gray-5"
        canEdit={!isReadonly}
        edit={{
          onClose: submitNote,
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
        {watch('year')}
      </TableCell>
      <TableCell className="text-primary-9 border-b border-gray-5">
        <RichTextEditor
          unstyled
          initialValue={htmlToText(note.note)}
          onChange={(html) => setValue('description', html)}
          onBlur={submitNote}
          debounceDelayOnChange={500}
        />
      </TableCell>
      <TableCell className="text-sm text-primary-10 align-top border-b border-gray-5">
        <MetadataNoteView note={note} />
      </TableCell>
      <VisibleWhen condition={!isReadonly}>
        <TableCell className="text-right border-b border-gray-5">
          <div className="invisible group-hover:visible">
            <NoteDeletionModal
              fiche={fiche}
              editedNote={note}
              onDelete={onDeleteNote}
            />
          </div>
        </TableCell>
      </VisibleWhen>
    </TableRow>
  );
};
