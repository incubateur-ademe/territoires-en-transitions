import * as z from 'zod/mini';

export const actionImpactStatutCategorieSchema = z.enum(['en_cours', 'realise']);

export type ActionImpactStatutCategorie = z.infer<
  typeof actionImpactStatutCategorieSchema
>;

export const actionImpactStatutSchema = z.nullable(
  actionImpactStatutCategorieSchema
);

export type ActionImpactStatut = z.infer<typeof actionImpactStatutSchema>;
