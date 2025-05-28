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
      titre: z
        .string()
        .optional()
        .describe("Recherche fulltext sur le titre de l'indicateur"),
      indicateurIds: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.coerce.number().array())
        .optional()
        .describe("Identifiants de l'indicateur (séparés par des virgules)"),
      identifiantsReferentiel: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.string().array())
        .optional()
        .describe('Identifiants du référentiel (séparés par des virgules)'),
    })
    .describe('Filtre de récupération des définitions des indicateurs');

export type ListDefinitionsApiRequest = z.infer<
  typeof listDefinitionsApiRequestSchema
>;
