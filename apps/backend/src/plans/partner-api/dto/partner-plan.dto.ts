import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const planTypeSchema = z
  .object({
    id: z.number().describe("Identifiant du type de plan"),
    type: z.string().describe('Libellé du type (ex: "Plan Climat Air Énergie Territorial")'),
    categorie: z.string().describe('Catégorie du type (ex: "Plans thématiques")'),
  })
  .describe("Type de plan d'action");

const planSummarySchema = z
  .object({
    id: z.number().describe("Identifiant du plan"),
    nom: z.string().nullable().describe("Nom du plan d'action"),
    type: planTypeSchema.nullable().describe("Type du plan (null si non typé)"),
    collectiviteId: z.number().describe('Identifiant de la collectivité'),
    nbAxes: z.number().describe("Nombre d'axes dans le plan"),
    nbFiches: z.number().describe('Nombre de fiches action non-restreintes'),
    createdAt: z.string().datetime().describe('Date de création (ISO 8601)'),
    modifiedAt: z.string().datetime().describe('Date de dernière modification (ISO 8601)'),
  })
  .describe("Résumé d'un plan d'action");

export const listPlansResponseSchema = z
  .object({
    plans: z.array(planSummarySchema).describe("Liste des plans d'action"),
  })
  .describe("Réponse de la liste des plans d'action d'une collectivité");

export class ListPlansResponseDto extends createZodDto(
  listPlansResponseSchema
) {}

const axeTreeNodeSchema: z.ZodType<{
  id: number;
  nom: string | null;
  axes: unknown[];
  ficheIds: number[];
}> = z.lazy(() =>
  z.object({
    id: z.number().describe("Identifiant de l'axe"),
    nom: z.string().nullable().describe("Nom de l'axe"),
    axes: z.array(axeTreeNodeSchema).describe('Sous-axes enfants'),
    ficheIds: z
      .array(z.number())
      .describe('Identifiants des fiches action rattachées à cet axe'),
  })
);

export const getPlanResponseSchema = z
  .object({
    id: z.number().describe("Identifiant du plan"),
    nom: z.string().nullable().describe("Nom du plan d'action"),
    type: planTypeSchema.nullable().describe("Type du plan (null si non typé)"),
    collectiviteId: z.number().describe('Identifiant de la collectivité'),
    ficheIds: z
      .array(z.number())
      .describe('Identifiants des fiches action rattachées directement au plan'),
    axes: z.array(axeTreeNodeSchema).describe("Arborescence des axes du plan"),
    createdAt: z.string().datetime().describe('Date de création (ISO 8601)'),
    modifiedAt: z.string().datetime().describe('Date de dernière modification (ISO 8601)'),
  })
  .describe("Détail d'un plan d'action avec arborescence complète des axes");

export class GetPlanResponseDto extends createZodDto(getPlanResponseSchema) {}
