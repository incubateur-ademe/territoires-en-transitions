import { collectiviteResumeSchema } from '@/domain/collectivites';
import { IndicateurValeur, VerificationTrajectoireStatus } from '@/domain/indicateurs';
import { z } from 'zod';
import { dataInputForTrajectoireComputeSchema } from './donnees-calcul-trajectoire-a-remplir.dto';

export const verificationTrajectoireResponseSchema = z.object({
  status: z
    .enum(VerificationTrajectoireStatus)
    .describe(
      'Status de la vérification des données pour le calcul de la trajectoire SNBC'
    ),
  modifiedAt: z.iso
    .datetime()
    .optional()
    .describe('Date de dernière modification'),
  donneesEntree: dataInputForTrajectoireComputeSchema
    .nullable()
    .describe(
      'Données qui seront utilisées pour le calcul de la trajectoire SNBC.'
    ),
  epci: collectiviteResumeSchema
    .omit({ communeCode: true })
    .describe("Informations de l'EPCI"),
  sourcesDonneesEntree: z
    .string()
    .array()
    .optional()
    .describe('Source des données utilisées lorsque le calcul a déjà été fait'),
  indentifiantsReferentielManquantsDonneesEntree: z
    .array(z.string())
    .optional()
    .describe(
      "Identifiants du référentiel manquants dans les données d'entrée lorsque le calcul a déjà été fait"
    ),
});
export type VerificationTrajectoireResponseType = z.infer<
  typeof verificationTrajectoireResponseSchema
>;

export interface VerificationTrajectoireResultType
  extends VerificationTrajectoireResponseType {
  valeurs?: IndicateurValeur[];
}
