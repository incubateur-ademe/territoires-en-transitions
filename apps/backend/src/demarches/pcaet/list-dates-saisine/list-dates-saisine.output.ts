import { z } from 'zod';

export const dateSaisineSchema = z.object({
  dateSaisine: z.string(),
  createdAt: z.string(),
  createdByNom: z.string(),
});

export type DateSaisine = z.infer<typeof dateSaisineSchema>;
