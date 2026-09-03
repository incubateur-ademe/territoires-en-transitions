import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import z from 'zod';

export const listDocumentsReferentielInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  referentielId: referentielIdEnumSchema,
});

export type ListDocumentsReferentielInput = z.infer<typeof listDocumentsReferentielInputSchema>;
