import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import z from 'zod';

export const listDocumentsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  referentielId: referentielIdEnumSchema,
});

export type ListDocumentsInput = z.infer<typeof listDocumentsInputSchema>;
