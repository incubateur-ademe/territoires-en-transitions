import { paginationNoSortSchemaOptionalLimit } from '@/backend/utils/pagination.schema';
import { z } from 'zod';

export const listDefinitionsInputSchema = paginationNoSortSchemaOptionalLimit
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
    ficheActionIds: z
      .number()
      .int()
      .array()
      .optional()
      .describe(
        "Identifiants des fiches actions auxquelles les indicateurs sont liés (au moins l'une d'entre elles)"
      ),
    identifiantsReferentiel: z
      .string()
      .array()
      .optional()
      .describe('Identifiants du référentiel'),
  })
  .optional()
  .describe('Filtre de récupération des définitions des indicateurs');

export type ListDefinitionsInput = z.infer<typeof listDefinitionsInputSchema>;
