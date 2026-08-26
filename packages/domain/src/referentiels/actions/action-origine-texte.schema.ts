import * as z from 'zod/mini';

export const actionOrigineTexteSchema = z.object({
  referentielId: z.string(),
  actionId: z.string(),
  origineReferentielId: z.string(),
  origineActionId: z.string(),
});

export type ActionOrigineTexte = z.infer<typeof actionOrigineTexteSchema>;
