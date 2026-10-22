import * as z from 'zod/mini';
import { ActionDefinition } from './action-definition.schema';

/** Champs de texte d'une action qui peuvent contenir des balises `{{si …}}` */
export const TEMPLATED_ACTION_FIELDS = [
  'nom',
  'description',
  'contexte',
  'exemples',
  'ressources',
  'reductionPotentiel',
  'perimetreEvaluation',
  'preuve',
] as const satisfies ReadonlyArray<keyof ActionDefinition>;

export type TemplatedActionField = (typeof TEMPLATED_ACTION_FIELDS)[number];

/**
 * Textes d'une action rendus pour un profil de collectivité, seulement pour
 * les champs qui diffèrent du rendu par défaut (celui des définitions).
 */
export const actionTextOverridesSchema = z.partial(
  z.object({
    nom: z.string(),
    description: z.string(),
    contexte: z.string(),
    exemples: z.string(),
    ressources: z.string(),
    reductionPotentiel: z.string(),
    perimetreEvaluation: z.string(),
    preuve: z.nullable(z.string()),
  } satisfies Record<TemplatedActionField, z.ZodMiniType>)
);

export type ActionTextOverrides = z.infer<typeof actionTextOverridesSchema>;

/**
 * Applique les surcharges de texte d'une action à sa définition. Seuls les
 * champs présents dans la définition sont remplacés : une sélection partielle
 * (le seul `nom`, par exemple) ne reçoit pas les autres textes.
 */
export function applyActionTextOverrides<T extends Partial<ActionDefinition>>(
  definition: T,
  overrides: ActionTextOverrides | undefined
): T {
  if (!overrides) {
    return definition;
  }
  const result = { ...definition };
  for (const field of TEMPLATED_ACTION_FIELDS) {
    if (Object.hasOwn(overrides, field) && Object.hasOwn(definition, field)) {
      (result as Partial<ActionDefinition>)[field] = overrides[field] as never;
    }
  }
  return result;
}
