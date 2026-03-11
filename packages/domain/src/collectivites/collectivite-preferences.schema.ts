import * as z from 'zod/mini';

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
