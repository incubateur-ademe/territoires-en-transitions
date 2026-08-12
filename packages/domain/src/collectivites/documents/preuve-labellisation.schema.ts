import * as z from 'zod/mini';
import { objetPreuveEnumSchema } from '../../referentiels/labellisations/objet-preuve.enum.schema';
import { preuveBaseSchema } from './preuve-base.schema';

export const preuveLabellisationSchema = z.object({
  ...preuveBaseSchema.shape,
  demandeId: z.number(),
  objet: z.nullable(objetPreuveEnumSchema),
});

export type PreuveLabellisation = z.infer<typeof preuveLabellisationSchema>;
