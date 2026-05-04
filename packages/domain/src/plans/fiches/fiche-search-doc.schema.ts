import { z } from 'zod';
import { ficheSchema } from './fiche.schema';

/**
 * `FicheSearchDocSchema` — projection of `ficheSchema` for the global ⌘K
 * modal, plus a synthesized `visibleCollectiviteIds` field that the indexer
 * derives by joining `fiche_action_sharing` to the owner's collectiviteId.
 *
 * `titre` is tightened to non-null. The domain field is nullable, but the
 * indexer falls back to `'Nouvelle action'` so the wire shape always
 * carries a string; the strict type makes the read-side contract explicit.
 *
 * The `.max(300)` and `.max(20000)` validators on `ficheSchema.titre` /
 * `description` survive the pick — non-destructive validation that's
 * already enforced upstream by the Drizzle column shapes.
 *
 * Field names are camelCase, aligned with the rest of the TypeScript
 * codebase.
 */
export const FicheSearchDocSchema = ficheSchema
  .pick({
    id: true,
    titre: true,
    description: true,
    parentId: true,
  })
  .extend({
    titre: z.string(),
    visibleCollectiviteIds: z.array(z.number().int()),
  });
export type FicheSearchDoc = z.infer<typeof FicheSearchDocSchema>;
