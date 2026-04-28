import * as z from 'zod/mini';
import { axeTableSchema } from './axe.schema';

/**
 * `AxeSearchDocSchema` — projection of `axeTableSchema` for the global ⌘K
 * modal. Field names match the domain accessors (`parent`, `plan`) so the
 * search-doc stays in sync as the `axe` table shape evolves.
 *
 * Two deliberate divergences from the domain:
 *  - `nom` is tightened to non-null. The plan-indexer skips axes with
 *    `nom IS NULL` (cf. its header doc), so the wire shape never carries
 *    null in practice; the strict type makes the read-side contract
 *    explicit.
 *  - `plan` is tightened to non-null. The domain field is nullable (root
 *    plans may have `plan IS NULL`), but the indexer synthesizes
 *    `axe.plan ?? axe.id` so the wire value is always a number — used by
 *    the frontend to route sub-axe clicks to the containing plan.
 *
 * Field names are camelCase, aligned with the rest of the TypeScript
 * codebase. Single-word column names (`parent`, `plan`) keep their bare
 * form, matching the Drizzle accessors.
 */
export const AxeSearchDocSchema = z.extend(
  z.pick(axeTableSchema, {
    id: true,
    collectiviteId: true,
    nom: true,
    parent: true,
  }),
  {
    nom: z.string(),
    plan: z.number().check(z.int()),
  }
);
export type AxeSearchDoc = z.infer<typeof AxeSearchDocSchema>;
