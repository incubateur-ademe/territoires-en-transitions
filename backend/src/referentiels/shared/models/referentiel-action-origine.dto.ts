import { z } from 'zod';

export const referentielActionOrigineSchema = z.object({
  referentielId: z.string(),
  actionId: z.string(),
  ponderation: z.number(),
  nom: z.string().nullable(),
});

export type ReferentielActionOrigineType = z.infer<
  typeof referentielActionOrigineSchema
>;
