import * as z from 'zod/mini';
import { ReferentielId } from '../referentiels';

/** Referentiel ids that can be toggled in the nav (excludes te-test). */
export const collectiviteReferentielDisplayIds = ['cae', 'eci', 'te'] as const;
export type CollectiviteReferentielDisplayId =
  (typeof collectiviteReferentielDisplayIds)[number];

export const referentielModeValues = ['write', 'readonly', 'archived'] as const;
export type ReferentielMode = (typeof referentielModeValues)[number];

const referentielModeSchema = z.enum(referentielModeValues);

export const populatedFromCaeEciSchema = z.object({
  populatedAt: z.string(),
  populatedBy: z.string(),
});

export type PopulatedFromCaeEci = z.infer<typeof populatedFromCaeEciSchema>;

const referentielPreferenceFieldsSchema = z.object({
  display: z.boolean(),
  mode: referentielModeSchema,
});

function checkArchivedDisplayInvariant(
  payload: z.core.ParsePayload<{
    display: boolean;
    mode: ReferentielMode;
  }>
) {
  if (payload.value.mode === 'archived' && payload.value.display) {
    payload.issues.push({
      code: 'custom',
      message: 'archived mode requires display: false',
      input: payload.value,
      path: ['display'],
    });
  }
}

const referentielPreferenceSchema = referentielPreferenceFieldsSchema.check(
  checkArchivedDisplayInvariant
);

export type ReferentielPreference = z.infer<typeof referentielPreferenceSchema>;

export const referentielPreferenceTESchema = z
  .extend(referentielPreferenceFieldsSchema, {
    populatedFromCaeEci: z.optional(populatedFromCaeEciSchema),
  })
  .check(checkArchivedDisplayInvariant);

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
