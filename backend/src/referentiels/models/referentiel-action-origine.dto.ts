import { z } from 'zod';

export const referentielActionOrigineSchema = z.object({
  referentiel_id: z.string(),
  action_id: z.string(),
  ponderation: z.number(),
  nom: z.string().nullable(),
});

export type ReferentielActionOrigineType = z.infer<
  typeof referentielActionOrigineSchema
>;
