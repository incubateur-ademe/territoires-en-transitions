import { collectiviteResumeSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import { z } from 'zod';
import { IndicateurValeur } from '../shared/models/indicateur-valeur.table';
import { donneesCalculTrajectoireARemplirSchema } from './donnees-calcul-trajectoire-a-remplir.dto';

export enum VerificationTrajectoireStatus {
  DROITS_INSUFFISANTS = 'droits_insuffisants',
  COMMUNE_NON_SUPPORTEE = 'commune_non_supportee',
  DEJA_CALCULE = 'deja_calcule',
  MISE_A_JOUR_DISPONIBLE = 'mise_a_jour_disponible',
  PRET_A_CALCULER = 'pret_a_calculer',
  DONNEES_MANQUANTES = 'donnees_manquantes',
}

export const verificationTrajectoireResponseSchema = z.object({
  status: z
    .nativeEnum(VerificationTrajectoireStatus)
    .describe(
      'Status de la vérification des données pour le calcul de la trajectoire SNBC'
    ),
  modifiedAt: z
    .string()
    .datetime()
    .optional()
    .describe('Date de dernière modification'),
  donneesEntree: donneesCalculTrajectoireARemplirSchema
    .optional()
    .describe(
      'Données qui seront utilisées pour le calcul de la trajectoire SNBC.'
    ),
  epci: collectiviteResumeSchema.optional().describe("Informations de l'EPCI"),
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
