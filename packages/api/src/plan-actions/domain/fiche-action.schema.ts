import { z } from 'zod';

export const noteSuiviSchema = z.object({
  id: z.number(),
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  modifiedAt: z.string().datetime(),
  modifiedBy: z.string(),
  dateNote: z.string().datetime(),
  note: z.string(),
});

export type FicheActionNote = z.infer<typeof noteSuiviSchema>;
