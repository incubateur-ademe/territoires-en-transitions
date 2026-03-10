import { createZodDto } from 'nestjs-zod';
import { statutEnumValues } from '@tet/domain/plans';
import { z } from 'zod';

export const collectiviteIdParamSchema = z
  .object({
    collectiviteId: z.coerce
      .number()
      .int()
      .positive()
      .describe('Identifiant de la collectivité'),
  })
  .describe('Paramètre de chemin pour identifier une collectivité');

export class CollectiviteIdParamDto extends createZodDto(
  collectiviteIdParamSchema
) {}

export const planIdParamSchema = collectiviteIdParamSchema.extend({
  planId: z.coerce
    .number()
    .int()
    .positive()
    .describe("Identifiant du plan d'action"),
});

export class PlanIdParamDto extends createZodDto(planIdParamSchema) {}

export const ficheIdParamSchema = collectiviteIdParamSchema.extend({
  ficheId: z.coerce
    .number()
    .int()
    .positive()
    .describe('Identifiant de la fiche action'),
});

export class FicheIdParamDto extends createZodDto(ficheIdParamSchema) {}

export const listFichesQuerySchema = z
  .object({
    planId: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Filtrer par plan d'action"),
    statut: z
      .enum(statutEnumValues)
      .optional()
      .describe(
        'Filtrer par statut (ex: "En cours", "Réalisé", "À venir")'
      ),
    page: z.coerce
      .number()
      .int()
      .positive()
      .default(1)
      .describe('Numéro de page (défaut: 1)'),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Nombre de résultats par page (défaut: 20, max: 100)'),
    modifiedSince: z
      .string()
      .datetime({ offset: true })
      .optional()
      .describe(
        'Date ISO 8601 pour filtrer les fiches modifiées depuis cette date (synchro incrémentale)'
      ),
  })
  .describe('Paramètres de filtrage et pagination pour la liste des fiches');

export class ListFichesQueryDto extends createZodDto(listFichesQuerySchema) {}

export const paginationResponseSchema = z
  .object({
    page: z.number().describe('Page courante'),
    limit: z.number().describe('Nombre de résultats par page'),
    count: z.number().describe('Nombre total de résultats'),
    nbOfPages: z.number().describe('Nombre total de pages'),
  })
  .describe('Informations de pagination');
