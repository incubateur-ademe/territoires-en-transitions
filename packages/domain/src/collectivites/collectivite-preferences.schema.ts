import * as z from 'zod/mini';
import { ReferentielId } from '../referentiels';

/** Referentiel ids with per-collectivité preference settings (excludes te-test). */
export const collectiviteReferentielPreferenceIds = [
  'cae',
  'eci',
  'te',
] as const satisfies readonly ReferentielId[];

export type CollectiviteReferentielPreferenceId =
  (typeof collectiviteReferentielPreferenceIds)[number];

export function isCollectiviteReferentielPreferenceId(
  referentielId: ReferentielId
): referentielId is CollectiviteReferentielPreferenceId {
  return collectiviteReferentielPreferenceIds.some((id) => id === referentielId);
}

export const referentielModeValues = ['write', 'readonly', 'archived'] as const;
export type ReferentielMode = (typeof referentielModeValues)[number];

const referentielModeSchema = z.enum(referentielModeValues);

export const populatedFromCaeEciSchema = z.object({
  populatedAt: z.string(),
  populatedBy: z.string(),
});

export type PopulatedFromCaeEci = z.infer<typeof populatedFromCaeEciSchema>;

/**
 * `mode` (capacité : write / readonly / archived) et `display` (présence dans la
 * navigation) sont indépendants. En particulier un référentiel CAE/ECI
 * post-bascule reste `mode: 'archived'` tout en gardant `display: true` s'il
 * contenait des données : la nav l'affiche alors en lecture seule avec le
 * libellé "(archivé)". Un référentiel jamais engagé est `archived` +
 * `display: false` et disparaît de la nav.
 */
const referentielPreferenceSchema = z.object({
  display: z.boolean(),
  mode: referentielModeSchema,
});


export type ReferentielPreference = z.infer<typeof referentielPreferenceSchema>;

export const referentielPreferenceTESchema = z.extend(referentielPreferenceSchema, {
  populatedFromCaeEci: z.optional(populatedFromCaeEciSchema),
});

export type ReferentielPreferenceTE = z.infer<
  typeof referentielPreferenceTESchema
>;

export const collectiviteReferentielPreferencesSchema = z.object({
  cae: referentielPreferenceSchema,
  eci: referentielPreferenceSchema,
  te: referentielPreferenceTESchema,
});

export type CollectiviteReferentielPreferences = z.infer<
  typeof collectiviteReferentielPreferencesSchema
>;

export type ReferentielDisplayMap = {
  cae: boolean;
  eci: boolean;
  te: boolean;
};

export const collectivitePreferencesSchema = z.object({
  referentiels: collectiviteReferentielPreferencesSchema,
});

export type CollectivitePreferences = z.infer<
  typeof collectivitePreferencesSchema
>;

export const defaultCollectivitePreferences: CollectivitePreferences = {
  referentiels: {
    cae: { display: true, mode: 'write' },
    eci: { display: true, mode: 'write' },
    te: { display: true, mode: 'readonly' },
  },
} as const;

// référentiels affichés quand le feature flag `is-referentiel-te-enabled` n'est pas activé
export const REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY: ReferentielDisplayMap =
  {
    eci: true,
    cae: true,
    te: false,
  } as const;

export function getReferentielDisplayMap(
  referentiels: CollectiviteReferentielPreferences
): ReferentielDisplayMap {
  return {
    cae: referentiels.cae.display,
    eci: referentiels.eci.display,
    te: referentiels.te.display,
  };
}

export function getEnabledReferentielIdsFromDisplayMap(
  displayMap: ReferentielDisplayMap
): ReferentielId[] {
  return Object.entries(displayMap)
    .filter(([_, enabled]) => enabled)
    .map(([id]) => id as ReferentielId);
}
