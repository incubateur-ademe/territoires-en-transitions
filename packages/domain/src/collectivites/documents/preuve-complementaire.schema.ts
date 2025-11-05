import * as z from 'zod/mini';
import { preuveBaseSchema } from './preuve-base.schema';

export const preuveComplementaireSchema = z.object({
  ...preuveBaseSchema.shape,
  actionId: z.string(),
});

export type PreuveComplementaire = z.infer<typeof preuveComplementaireSchema>;
