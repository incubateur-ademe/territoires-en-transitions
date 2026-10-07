import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const correlatedActionTexteSchema = z.object({
  referentielId: referentielIdEnumSchema,
  actionId: z.string(),
  nom: z.string().nullable(),
});

export type CorrelatedActionTexte = z.infer<typeof correlatedActionTexteSchema>;
