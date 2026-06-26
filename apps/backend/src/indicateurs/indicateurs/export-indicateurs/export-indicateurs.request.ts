import {
  listDefinitionsInputFiltersSchema,
  listDefinitionsInputSortValues,
} from '@tet/domain/indicateurs';
import { z } from 'zod';

const exportIndicateursSortSchema = z.object({
  field: z.enum(listDefinitionsInputSortValues),
  direction: z.enum(['asc', 'desc']).prefault('desc'),
});

/**
 * Schéma d'export des indicateurs sous forme d'union discriminée :
 * - `selection` : la liste explicite des identifiants à exporter ;
 * - `all` : les filtres de la liste, le backend résolvant lui-même
 *   l'ensemble complet (toutes pages confondues) via `ListIndicateursService`.
 */
export const exportIndicateursRequestSchema = z
  .discriminatedUnion('mode', [
    z.object({
      mode: z.literal('selection'),
      collectiviteId: z.int().describe('Identifiant de la collectivité'),
      indicateurIds: z
        .int()
        .array()
        .min(1)
        .describe('Identifiants des indicateurs à exporter'),
    }),
    z.object({
      mode: z.literal('all'),
      collectiviteId: z.int().describe('Identifiant de la collectivité'),
      filters: listDefinitionsInputFiltersSchema
        .optional()
        .prefault({})
        .describe('Filtres de la liste des indicateurs'),
      sort: exportIndicateursSortSchema
        .array()
        .optional()
        .describe("Tri à appliquer (cohérent avec l'ordre affiché)"),
    }),
  ])
  .describe('Export des indicateurs');

export type ExportIndicateursRequestType = z.infer<
  typeof exportIndicateursRequestSchema
>;
