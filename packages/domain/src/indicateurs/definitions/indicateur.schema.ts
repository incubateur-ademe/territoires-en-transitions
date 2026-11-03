import * as z from 'zod/mini';
import { indicateurDefinitionSchema } from './indicateur-definition.schema';
import {
  getIncoherentNatureError,
  type IndicateurNatureResult,
  isIndicateurPerso,
  isIndicateurPredefini,
} from './indicateur-nature.rules';
import {
  indicateurPersoNatureSchema,
  indicateurPredefiniNatureSchema,
} from './indicateur-nature.schema';

export const indicateurCommonSchema = z.omit(indicateurDefinitionSchema, {
  collectiviteId: true,
  identifiantReferentiel: true,
  groupementId: true,
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
export type IndicateurPerso =z.infer<typeof indicateurPersoSchema>;
export type IndicateurPredefini = z.infer<typeof indicateurPredefiniSchema>;
export type Indicateur = IndicateurPerso | IndicateurPredefini;

export const toIndicateur = (
  definition: z.infer<typeof indicateurDefinitionSchema>
): IndicateurNatureResult<Indicateur> => {
  if (isIndicateurPerso(definition) || isIndicateurPredefini(definition)) {
    return { success: true, data: definition };
  }
  return { success: false, error: getIncoherentNatureError(definition) };
};
