import { z } from 'zod';

export const newNoteFormSchema = z
  .object({
    year: z
      .number({
        error: "L'année est requise",
      })
      .min(1990, "L'année doit être supérieure ou égale à 1990")
      .max(
        new Date().getFullYear() + 10,
        "L'année ne peut pas être dans plus de 10 ans"
      )
      .optional(),
    description: z.string().min(1, 'La description est requise'),
  })
  .refine((data) => data.year !== undefined, {
    message: "L'année est requise",
    path: ['year'],
  });

export type NewNoteFormValues = z.infer<typeof newNoteFormSchema>;
