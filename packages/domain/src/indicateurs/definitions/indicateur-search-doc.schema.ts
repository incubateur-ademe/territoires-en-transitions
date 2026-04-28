import * as z from 'zod/mini';
import { indicateurDefinitionSchema } from './indicateur-definition.schema';

/**
 * `IndicateurSearchDocSchema` — projection of `indicateurDefinitionSchema`
 * for the global ⌘K modal. Pure pick: every field name and nullability
 * already matches the domain schema, so the search-doc carries no
 * divergence.
 *
 * `collectiviteId` is null for predefined / global indicateurs and set for
 * custom (per-collectivité) ones — the proxy filter handles this with
 * `(collectiviteId IS NULL OR collectiviteId = ${activeId})`.
 *
 * Field names are camelCase, aligned with the rest of the TypeScript
 * codebase.
 */
export const IndicateurSearchDocSchema = z.pick(indicateurDefinitionSchema, {
  id: true,
  identifiantReferentiel: true,
  collectiviteId: true,
  groupementId: true,
  titre: true,
  titreLong: true,
  description: true,
});
export type IndicateurSearchDoc = z.infer<typeof IndicateurSearchDocSchema>;
