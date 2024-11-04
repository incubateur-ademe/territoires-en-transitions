import { IndicateurValeurType } from "./indicateur-valeur.table";
import { z } from 'zod';
import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { epciSchema } from "../../collectivites/models/epci.table";
import { donneesCalculTrajectoireARemplirSchema } from "./donnees-calcul-trajectoire-a-remplir.dto";

extendZodWithOpenApi(z);

export enum VerificationTrajectoireStatus {
  COMMUNE_NON_SUPPORTEE = 'commune_non_supportee',
  DEJA_CALCULE = 'deja_calcule',
  PRET_A_CALCULER = 'pret_a_calculer',
  DONNEES_MANQUANTES = 'donnees_manquantes',
}

export const verificationTrajectoireResponseSchema = extendApi(
    z.object({
      status: z.nativeEnum(VerificationTrajectoireStatus).openapi({
        description:
          'Status de la vérification des données pour le calcul de la trajectoire SNBC',
      }),
      donneesEntree: donneesCalculTrajectoireARemplirSchema.optional().openapi({
        description:
          'Données qui seront utilisées pour le calcul de la trajectoire SNBC.',
      }),
      epci: epciSchema.optional().openapi({
        description: "Informations de l'EPCI",
      }),
      sourceDonneesEntree: z.string().optional().openapi({
        description:
          'Source des données utilisées lorsque le calcul a déjà été fait',
      }),
      indentifiantsReferentielManquantsDonneesEntree: z
        .array(z.string())
        .optional()
        .openapi({
          description:
            "Identifiants du référentiel manquants dans les données d'entrée lorsque le calcul a déjà été fait",
        }),
    })
  );
  export type VerificationTrajectoireResponseType = z.infer<
    typeof verificationTrajectoireResponseSchema
  >;
  
  export interface VerificationTrajectoireResultType
    extends VerificationTrajectoireResponseType {
    valeurs?: IndicateurValeurType[];
  }