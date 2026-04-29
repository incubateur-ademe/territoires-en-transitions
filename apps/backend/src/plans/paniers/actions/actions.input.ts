import { ActionImpactStatutCategorie } from '@tet/domain/plans';
import { z } from 'zod';

export const panierActionInputSchema = z.object({
  panierId: z.string().uuid(),
  actionId: z.number().int().positive(),
});

export type PanierActionInput = z.infer<typeof panierActionInputSchema>;

const actionImpactStatutCategorieValues = [
  'en_cours',
  'realise',
] as const satisfies readonly ActionImpactStatutCategorie[];

export const setActionStatusInputSchema = panierActionInputSchema.extend({
  categorie: z.enum(actionImpactStatutCategorieValues),
});

export type SetActionStatusInput = z.infer<typeof setActionStatusInputSchema>;
