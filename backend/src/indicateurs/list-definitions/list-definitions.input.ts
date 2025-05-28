import { paginationNoSortSchemaOptionalLimit } from '@/backend/utils/pagination.schema';
import { z } from 'zod';

export const listDefinitionsInputSchema = paginationNoSortSchemaOptionalLimit
  .extend({
    collectiviteId: z.coerce
      .number()
      .int()
      .optional()
      .describe('Identifiant de la collectivité'),
    titre: z
      .string()
      .optional()
      .describe("Recherche fulltext sur le titre de l'indicateur"),
    indicateurIds: z.coerce
      .number()
      .int()
      .array()
      .optional()
      .describe("Identifiants de l'indicateur"),
    identifiantsReferentiel: z
      .string()
      .array()
      .optional()
      .describe('Identifiants du référentiel'),
  })
  .optional()
  .describe('Filtre de récupération des définitions des indicateurs');

export type ListDefinitionsInput = z.infer<typeof listDefinitionsInputSchema>;
