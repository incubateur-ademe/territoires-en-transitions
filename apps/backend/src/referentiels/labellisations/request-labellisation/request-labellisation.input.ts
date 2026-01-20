import {
  etoileEnumSchema,
  referentielIdEnumSchema,
  sujetDemandeEnumSchema,
} from '@tet/domain/referentiels';
import z from 'zod';

export const requestLabellisationInputSchema = z.object({
  collectiviteId: z.number(),
  referentiel: referentielIdEnumSchema,
  sujet: sujetDemandeEnumSchema,
  etoiles: z.nullable(etoileEnumSchema),
});

export type RequestLabellisationInput = z.infer<typeof requestLabellisationInputSchema>;
