import { z } from 'zod';

export const noteSuiviSchema = z.object({
  id: z.number(),
  createdAt: z.iso.datetime(),
  createdBy: z.string(),
  modifiedAt: z.iso.datetime(),
  modifiedBy: z.string(),
  dateNote: z.iso.datetime(),
  note: z.string(),
});

export type FicheActionNote = z.infer<typeof noteSuiviSchema>;
