import * as z from 'zod';
import { bibliothequeFichierSchema } from './bibliotheque-fichier.schema';

/**
 * `DocumentSearchDocSchema` — projection of `bibliothequeFichierSchema` for
 * the global ⌘K modal.
 *
 * `collectiviteId` is widened to nullable: the search-doc treats null as
 * "global / system file" and the proxy filters accordingly with
 * `(collectiviteId IS NULL OR collectiviteId = ${activeId})`. The domain
 * schema currently types this column as non-null — that may need to be
 * reconciled separately (see follow-up note in the refactor plan).
 *
 * Field names are camelCase, aligned with the rest of the TypeScript
 * codebase.
 */
export const DocumentSearchDocSchema = bibliothequeFichierSchema
  .pick({
    id: true,
    filename: true,
  })
  .extend({
    collectiviteId: z.number().int().nullable(),
  });
export type DocumentSearchDoc = z.infer<typeof DocumentSearchDocSchema>;
