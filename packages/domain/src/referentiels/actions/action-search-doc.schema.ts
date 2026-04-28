import * as z from 'zod/mini';
import { actionDefinitionSchema } from './action-definition.schema';
import { actionTypeSchema } from './action-type.enum';

/**
 * `ActionSearchDocSchema` — projection of `actionDefinitionSchema` for the
 * global ⌘K modal, with synthesized fields for the (action × collectivité)
 * fan-out:
 *  - `id` is the composite string `'${actionId}:${collectiviteId}'` used as
 *    the Meilisearch primary key; the original `actionId` is preserved
 *    separately for navigation.
 *  - `collectiviteId` comes from the join row (one search-doc per activated
 *    collectivité), not from `actionDefinitionSchema`.
 *  - `type` is computed via `getActionTypeFromActionId` against the
 *    referentiel hierarchy — not a column on `action_definition`.
 *  - `commentaire` is widened to nullable: the indexer LEFT-JOINs
 *    `action_commentaire` and the row may be absent.
 *
 * Field names are camelCase, aligned with the rest of the TypeScript
 * codebase.
 */
export const ActionSearchDocSchema = z.extend(
  z.pick(actionDefinitionSchema, {
    actionId: true,
    referentielId: true,
    nom: true,
    description: true,
  }),
  {
    id: z.string(),
    collectiviteId: z.number().check(z.int()),
    type: actionTypeSchema,
    commentaire: z.nullable(z.string()),
  }
);
export type ActionSearchDoc = z.infer<typeof ActionSearchDocSchema>;
