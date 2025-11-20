import * as z from 'zod/mini';
import { categorieFNVSchema, thematiqueSchema } from '../../shared';

const lienSchema = z.object({
  label: z.string(),
  url: z.string(),
});

export const actionImpactSchema = z.object({
  id: z.number(),
  titre: z.string(),
  description: z.string(),
  descriptionComplementaire: z.string(),
  nbCollectiviteEnCours: z.number(),
  nbCollectiviteRealise: z.number(),
  actionContinue: z.boolean(),
  tempsDeMiseEnOeuvre: z.number(),
  fourchetteBudgetaire: z.number(),
  impactTier: z.number(),
  subventionsMobilisables: z.nullable(z.unknown()),
  ressourcesExternes: z.nullable(z.unknown()),
  rex: z.nullable(z.unknown()),
});

export const actionImpactTransformeSchema = z.object({
  ...z.omit(actionImpactSchema, {
    rex: true,
    ressourcesExternes: true,
    subventionsMobilisables: true,
  }).shape,

  rex: z.array(lienSchema),
  ressourcesExternes: z.array(lienSchema),
  subventionsMobilisables: z.array(lienSchema),
});

export type ActionImpactTransformeType = z.infer<
  typeof actionImpactTransformeSchema
>;

export const actionImpactSnippetSchema = z.object({
  ...actionImpactTransformeSchema.shape,
  thematiques: z.array(thematiqueSchema),
});

export type ActionImpactSnippetType = z.infer<typeof actionImpactSnippetSchema>;

export const actionImpactDetailsSchema = z.object({
  ...actionImpactTransformeSchema.shape,
  thematiques: z.nullable(z.array(thematiqueSchema)),
  categoriesFNV: z.nullable(z.array(categorieFNVSchema)),
});

export type ActionImpactDetailsType = z.infer<typeof actionImpactDetailsSchema>;
