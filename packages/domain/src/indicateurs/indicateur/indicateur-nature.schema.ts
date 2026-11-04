import * as z from 'zod/mini';

export const indicateurPersoNatureSchema = z.object({
  collectiviteId: z.number(),
  identifiantReferentiel: z.null(),
  groupementId: z.null(),
});

export const indicateurPredefiniNatureSchema = z.object({
  collectiviteId: z.null(),
  identifiantReferentiel: z.string(),
  groupementId: z.nullable(z.number()),
});

export type IndicateurPersoNatureFields = z.infer<
  typeof indicateurPersoNatureSchema
>;
export type IndicateurPredefiniNatureFields = z.infer<
  typeof indicateurPredefiniNatureSchema
>;
