import * as z from 'zod/mini';
import { preuveSchemaEssential } from '../../collectivites/documents/preuve.schema';
import { referentielIdEnumSchema } from '../referentiel-id.enum';
import { actionTypeSchema } from './action-type.enum';

const actionCategorieEnumValues = ['bases', 'mise en œuvre', 'effets'] as const;
const actionCategorieEnumSchema = z.enum(actionCategorieEnumValues);

export const actionIdSchema = z.string();
export type ActionId = z.infer<typeof actionIdSchema>;

export const actionDefinitionSchema = z.object({
  actionId: actionIdSchema,
  identifiant: z.string(),
  /** @deprecated use `referentielId` instead */
  referentiel: referentielIdEnumSchema,
  referentielId: referentielIdEnumSchema,
  referentielVersion: z.string(),
  nom: z.string(),
  description: z.string(),
  contexte: z.string(),
  exemples: z.string(),
  ressources: z.string(),
  reductionPotentiel: z.string(),
  perimetreEvaluation: z.string(),
  preuve: z.nullable(z.string()),
  points: z.nullable(z.number()),
  pourcentage: z.nullable(z.number()),
  categorie: z.nullable(actionCategorieEnumSchema),
  exprScore: z.nullable(z.string()),
  modifiedAt: z.iso.datetime(),

  depth: z.number(),
  actionType: actionTypeSchema,
  questionIds: z.array(z.string()),
});

export type ActionDefinition = z.infer<typeof actionDefinitionSchema>;

export const actionDefinitionEssentialSchema = z.object({
  actionId: z.string(),
  points: z.nullable(z.number()),
  level: z.number(),
  actionType: actionTypeSchema,
  // action catalogues include cae, eci but also biodiversite, eau
  tags: z.optional(z.array(z.string())),
  preuves: z.optional(z.array(preuveSchemaEssential)),
});

export type ActionDefinitionEssential = z.infer<
  typeof actionDefinitionEssentialSchema
>;
