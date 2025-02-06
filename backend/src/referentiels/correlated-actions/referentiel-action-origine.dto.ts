import { z } from 'zod';

export const correlatedActionSchema = z.object({
  referentielId: z.string(),
  actionId: z.string(),
  ponderation: z.number(),
  nom: z.string().nullable(),
});

export type CorrelatedAction = z.infer<typeof correlatedActionSchema>;
