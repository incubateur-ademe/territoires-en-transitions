import * as z from 'zod/mini';
import { ReferentielId } from '../referentiels';

/** Referentiel ids that can be toggled in the nav (excludes te-test). */
export const collectiviteReferentielDisplayIds = ['cae', 'eci', 'te'] as const;
export type CollectiviteReferentielDisplayId =
  (typeof collectiviteReferentielDisplayIds)[number];

const referentielDisplayMapSchema = z.object({
  cae: z.boolean(),
  eci: z.boolean(),
  te: z.boolean(),
});

export type ReferentielDisplayMap = z.infer<typeof referentielDisplayMapSchema>;

export const collectiviteReferentielPreferencesSchema = z.object({
  display: referentielDisplayMapSchema,
});

export type CollectiviteReferentielPreferences = z.infer<
  typeof collectiviteReferentielPreferencesSchema
>;

export const collectivitePreferencesSchema = z.object({
  referentiels: collectiviteReferentielPreferencesSchema,
});

export type CollectivitePreferences = z.infer<
  typeof collectivitePreferencesSchema
>;

export const defaultCollectivitePreferences: CollectivitePreferences = {
  referentiels: {
    display: {
      cae: true,
      eci: true,
      te: true,
    },
  },
} as const;

// référentiels affichés quand le feature flag `is-referentiel-te-enabled` n'est pas activé
export const REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY: ReferentielDisplayMap =
  {
    eci: true,
    cae: true,
    te: false,
  } as const;

export function getEnabledReferentielIdsFromDisplayMap(
  displayMap: ReferentielDisplayMap
): ReferentielId[] {
  return Object.entries(displayMap)
    .filter(([_, enabled]) => enabled)
    .map(([id]) => id as ReferentielId);
}
