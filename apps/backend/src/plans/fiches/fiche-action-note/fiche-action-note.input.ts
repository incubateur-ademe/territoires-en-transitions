import { ficheNoteUpsertSchema } from '@tet/domain/plans';
import z from 'zod';

export const ficheActionNoteListInputSchema = z.object({
  ficheId: z.number(),
});

export const ficheActionNoteUpsertInputSchema = z.object({
  ficheId: z.number(),
  note: ficheNoteUpsertSchema,
});

export const ficheActionNoteDeleteInputSchema = z.object({
  ficheId: z.number(),
  noteId: z.number(),
});
