import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const correlatedActionSchema = z.object({
  referentielId: referentielIdEnumSchema,
  actionId: z.string(),
  ponderation: z.number(),
  nom: z.string().nullable(),
});

export type CorrelatedAction = z.infer<typeof correlatedActionSchema>;
