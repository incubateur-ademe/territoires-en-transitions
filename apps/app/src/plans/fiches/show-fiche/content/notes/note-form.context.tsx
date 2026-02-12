import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { FicheNote } from '@tet/domain/plans';
import React, { createContext, useContext, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

export const noteFormSchema = z.object({
  year: z
    .number({
      message: "L'année est requise",
    })
    .min(1990, "L'année doit être supérieure ou égale à 1990")
    .max(
      new Date().getFullYear() + 10,
      "L'année ne peut pas être dans plus de 10 ans"
    ),
  description: z.string().min(1, 'La description est requise'),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

type NoteFormContextValue = {
  form: UseFormReturn<NoteFormValues>;
  submitNote: () => Promise<void>;
  isReadonly: boolean;
  note: FicheNote;
};

const NoteFormContext = createContext<NoteFormContextValue | null>(null);

type NoteFormProviderProps = {
  note: FicheNote;
  isReadonly: boolean;
  onUpsertNote: (editedNote: {
    id?: number;
    note: string;
    dateNote: number;
  }) => Promise<void>;
  children: React.ReactNode;
};

export const NoteFormProvider = ({
  note,
  isReadonly,
  onUpsertNote,
  children,
}: NoteFormProviderProps) => {
  const defaultYear = new Date(note.dateNote).getFullYear();
  const defaultDescription = note.note;

  const form = useForm<NoteFormValues>({
    resolver: standardSchemaResolver(noteFormSchema),
    mode: 'onChange',
    defaultValues: {
      year: defaultYear,
      description: defaultDescription,
    },
  });

  const submitNote = React.useCallback(async () => {
    await form.handleSubmit(async (data) => {
      await onUpsertNote({
        id: note.id,
        note: data.description,
        dateNote: data.year,
      });
    })();
  }, [form, note, onUpsertNote]);

  const value = useMemo(
    () => ({
      form,
      submitNote,
      isReadonly,
      note,
    }),
    [form, isReadonly, note, submitNote]
  );

  return (
    <NoteFormContext.Provider value={value}>
      {children}
    </NoteFormContext.Provider>
  );
};

export const useNoteForm = () => {
  const context = useContext(NoteFormContext);
  if (!context) {
    throw new Error('useNoteForm must be used within a NoteFormProvider');
  }
  return context;
};
