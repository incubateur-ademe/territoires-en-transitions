import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button, RichTextEditor, Select, TableCell, TableRow } from '@tet/ui';
import { htmlToText } from 'html-to-text';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { getYearsOptions } from '../../utils';

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
  description: z
    .string()
    .min(1, 'La description est requise')
    .refine((val) => htmlToText(val).length > 0, {
      message: 'La description est requise',
    }),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

type NoteTableNewRowProps = {
  onUpsertNote: (editedNote: {
    id?: number;
    note: string;
    dateNote: number;
  }) => Promise<void>;
  onCancel: () => void;
};

export const NoteTableNewRow = ({
  onUpsertNote,
  onCancel,
}: NoteTableNewRowProps) => {
  // As of today, RichTextEditor behaves strangely when controlled
  // hence the use of a key to force a re-render when the form is submitted
  const [editorKey, setEditorKey] = useState(0);

  const { yearsOptions } = getYearsOptions();
  const currentYear = new Date().getFullYear();

  const form = useForm<NoteFormValues>({
    resolver: standardSchemaResolver(noteFormSchema),
    defaultValues: { year: currentYear, description: '' },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const { control, handleSubmit, reset, setValue, formState } = form;

  const editorId = `note-editor-${editorKey}`;

  // Focus the editor when it mounts or when editorKey changes
  useEffect(() => {
    waitForMarkup(`#${editorId} div[contenteditable]`).then((el) => {
      (el as HTMLElement)?.focus?.();
    });
  }, [editorId]);

  const onSubmit = React.useCallback(
    async (data: NoteFormValues) => {
      await onUpsertNote({
        dateNote: data.year,
        note: data.description,
      });
      reset({ year: currentYear, description: undefined });
      setEditorKey((prev) => prev + 1);
    },
    [currentYear, onUpsertNote, reset]
  );

  return (
    <TableRow className="hover:bg-gray-50 group">
      <TableCell className="font-bold text-primary-9 text-sm border-b border-gray-5">
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
                }
              }}
              placeholder="Sélectionner une année"
            />
          )}
        />
      </TableCell>
      <TableCell className="text-primary-9 border-b border-gray-5">
        <RichTextEditor
          key={editorKey}
          id={editorId}
          unstyled
          initialValue={''}
          onChange={(html) =>
            setValue('description', html, { shouldValidate: true })
          }
          contentStyle={{
            size: 'sm',
            color: 'primary',
          }}
        />
      </TableCell>
      <TableCell className="text-right border-b border-gray-5 w-[100px]">
        <div className="flex justify-end gap-2">
          <Button
            size="xs"
            variant="outlined"
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={!formState.isValid}
            icon="save-line"
          />
          <Button
            size="xs"
            variant="grey"
            icon="close-line"
            onClick={() => {
              reset();
              onCancel();
            }}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};
