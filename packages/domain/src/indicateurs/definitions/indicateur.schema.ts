import * as z from 'zod/mini';
import { indicateurPeriodiciteSchema } from './indicateur-periodicite.schema';
import {
  getIncoherentNatureError,
  type IndicateurNatureFields,
  type IndicateurNatureResult,
  isIndicateurPerso,
  isIndicateurPredefini,
} from './indicateur-nature.rules';
import {
  indicateurPersoNatureSchema,
  indicateurPredefiniNatureSchema,
} from './indicateur-nature.schema';

export const indicateurCommonSchema = z.object({
  id: z.number(),
  version: z.string(),
  titre: z.string(),
  titreLong: z.nullable(z.string()),
  titreCourt: z.nullable(z.string()),
  description: z.nullable(z.string()),
  unite: z.string(),
  periodicite: indicateurPeriodiciteSchema,
  precision: z.number(),
  borneMin: z.nullable(z.number()),
  borneMax: z.nullable(z.number()),
  participationScore: z.boolean(),
  sansValeurUtilisateur: z.boolean(),
  valeurCalcule: z.nullable(z.string()),
  exprCible: z.nullable(z.string()),
  exprSeuil: z.nullable(z.string()),
  libelleCibleSeuil: z.nullable(z.string()),
  createdAt: z.string(),
  modifiedAt: z.string(),
  createdBy: z.nullable(z.uuid()),
  modifiedBy: z.nullable(z.uuid()),
});

export const indicateurPersoSchema = z.extend(
  indicateurCommonSchema,
  indicateurPersoNatureSchema.shape
);

export const indicateurPredefiniSchema = z.extend(
  indicateurCommonSchema,
  indicateurPredefiniNatureSchema.shape
);

export const indicateurSchema = z.union([
  indicateurPersoSchema,
  indicateurPredefiniSchema,
]);

export type IndicateurCommon = z.infer<typeof indicateurCommonSchema>;
export type IndicateurPerso = z.infer<typeof indicateurPersoSchema>;
export type IndicateurPredefini = z.infer<typeof indicateurPredefiniSchema>;
export type Indicateur = IndicateurPerso | IndicateurPredefini;

export type IndicateurCandidate = IndicateurCommon & IndicateurNatureFields;

export const toIndicateur = (
  candidate: IndicateurCandidate
): IndicateurNatureResult<Indicateur> => {
  if (isIndicateurPerso(candidate) || isIndicateurPredefini(candidate)) {
    return { success: true, data: candidate };
  }
  return { success: false, error: getIncoherentNatureError(candidate) };
};
