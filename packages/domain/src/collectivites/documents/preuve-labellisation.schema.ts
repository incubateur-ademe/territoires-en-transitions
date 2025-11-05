import * as z from 'zod/mini';
import { preuveBaseSchema } from './preuve-base.schema';

export const preuveLabellisationSchema = z.object({
  ...preuveBaseSchema.shape,
  demandeId: z.number(),
});

export type PreuveLabellisation = z.infer<typeof preuveLabellisationSchema>;
