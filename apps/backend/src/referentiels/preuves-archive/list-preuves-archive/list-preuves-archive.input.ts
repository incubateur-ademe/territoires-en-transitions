import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const listPreuvesArchiveInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  referentielId: referentielIdEnumSchema,
});

export type ListPreuvesArchiveInput = z.infer<
  typeof listPreuvesArchiveInputSchema
>;
