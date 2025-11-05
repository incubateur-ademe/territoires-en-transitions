import * as z from 'zod/mini';

export const actionOrigineSchema = z.object({
  referentielId: z.string(),
  actionId: z.string(),
  origineReferentielId: z.string(),
  origineActionId: z.string(),
  ponderation: z.number(),
});

export type ActionOrigine = z.infer<typeof actionOrigineSchema>;
