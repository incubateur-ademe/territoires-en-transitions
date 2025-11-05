import * as z from 'zod/mini';
import { preuveBaseSchema } from './preuve-base.schema';

export const preuveRapportSchema = z.object({
  ...preuveBaseSchema.shape,
  date: z.iso.datetime(),
});

export type PreuveRapport = z.infer<typeof preuveRapportSchema>;
