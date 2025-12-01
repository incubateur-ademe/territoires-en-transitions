import * as z from 'zod/mini';
import { preuveSchemaEssential } from '../../collectivites/documents/preuve.schema';
import { referentielIdEnumSchema } from '../referentiel-id.enum';
import { actionTypeIncludingExempleSchema } from './action-type.enum';

const actionCategorieEnumValues = ['bases', 'mise en œuvre', 'effets'] as const;
const actionCategorieEnumSchema = z.enum(actionCategorieEnumValues);

export const actionIdSchema = z.string();
export type ActionId = z.infer<typeof actionIdSchema>;

export const actionDefinitionSchema = z.object({
  actionId: actionIdSchema,
  referentiel: referentielIdEnumSchema,
  referentielId: z.string(),
  referentielVersion: z.string(),
  identifiant: z.string(),
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
});

export type ActionDefinition = z.infer<typeof actionDefinitionSchema>;

export const actionDefinitionSchemaCreate = z.partial(actionDefinitionSchema, {
  preuve: true,
  points: true,
  pourcentage: true,
  categorie: true,
  exprScore: true,
  modifiedAt: true,
});

export type ActionDefinitionCreate = z.infer<
  typeof actionDefinitionSchemaCreate
>;

export const actionDefinitionEssentialSchema = z.object({
  actionId: z.string(),
  points: z.nullable(z.number()),
  level: z.number(),
  actionType: actionTypeIncludingExempleSchema,
  // action catalogues include cae, eci but also biodiversite, eau
  tags: z.optional(z.array(z.string())),
  preuves: z.optional(z.array(preuveSchemaEssential)),
});

export type ActionDefinitionEssential = z.infer<
  typeof actionDefinitionEssentialSchema
>;
