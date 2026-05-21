import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const requestPreuvesArchiveInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  referentielId: referentielIdEnumSchema,
});

export type RequestPreuvesArchiveInput = z.infer<
  typeof requestPreuvesArchiveInputSchema
>;
