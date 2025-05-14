import { paginationNoSortSchemaOptionalLimit } from '@/backend/utils/pagination.schema';
import { z } from 'zod';

export const listDefinitionsApiRequestSchema =
  paginationNoSortSchemaOptionalLimit
    .extend({
      collectiviteId: z.coerce
        .number()
        .int()
        .optional()
        .describe('Identifiant de la collectivité'),
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
    .describe('Filtre de récupération des définitions des indicateurs');

export type ListDefinitionsApiRequest = z.infer<
  typeof listDefinitionsApiRequestSchema
>;
