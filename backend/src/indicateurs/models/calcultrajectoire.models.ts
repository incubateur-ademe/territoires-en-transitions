import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { epciSchema } from '../../collectivites/models/epci.table';
import { collectiviteRequestSchema } from '../../collectivites/models/collectivite.request';
import {
  indicateurAvecValeursSchema,
  IndicateurValeurType,
} from './indicateur-valeur.table';

extendZodWithOpenApi(z);

export enum CalculTrajectoireReset {
  MAJ_SPREADSHEET_EXISTANT = 'maj_spreadsheet_existant',
  NOUVEAU_SPREADSHEET = 'nouveau_spreadsheet',
}

export enum CalculTrajectoireResultatMode {
  DONNEES_EN_BDD = 'donnees_en_bdd',
  NOUVEAU_SPREADSHEET = 'nouveau_spreadsheet',
  MAJ_SPREADSHEET_EXISTANT = 'maj_spreadsheet_existant',
}

export const modeleTrajectoireTelechargementRequestSchema = extendApi(
  z.object({
    force_recuperation_xlsx: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .openapi({
        description:
          'Récupère les données du fichier xlsx depuis le drive plutôt que le cache local',
      }),
  })
);
export type ModeleTrajectoireTelechargementRequestType = z.infer<
  typeof modeleTrajectoireTelechargementRequestSchema
>;

export const verificationTrajectoireRequestSchema = extendApi(
  collectiviteRequestSchema.extend({
    force_recuperation_donnees: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .openapi({
        description:
          'Récupère les données même si la trajectoire a déjà été calculée',
      }),
    epci_info: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .openapi({
        description: "Retourne les informations de l'EPCI",
      }),
    force_utilisation_donnees_collectivite: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .openapi({
        description:
          "Force l'utilisation des données de la collectivité plutôt que celles du rare",
      }),
  })
);
export type VerificationTrajectoireRequestType = z.infer<
  typeof verificationTrajectoireRequestSchema
>;

export enum VerificationDonneesSNBCStatus {
  COMMUNE_NON_SUPPORTEE = 'commune_non_supportee',
  DEJA_CALCULE = 'deja_calcule',
  PRET_A_CALCULER = 'pret_a_calculer',
  DONNEES_MANQUANTES = 'donnees_manquantes',
}

export const donneesARemplirValeurSchema = extendApi(
  z.object({
    identifiants_referentiel: z.array(z.string()),
    valeur: z.number().nullable(),
    date_min: z.string().nullable(),
    date_max: z.string().nullable(),
  })
);
export type DonneesARemplirValeurType = z.infer<
  typeof donneesARemplirValeurSchema
>;

export const donneesARemplirResultSchema = extendApi(
  z.object({
    valeurs: z.array(donneesARemplirValeurSchema),
    identifiants_referentiel_manquants: z.array(z.string()),
  })
);
export type DonneesARemplirResultType = z.infer<
  typeof donneesARemplirResultSchema
>;

export const donneesCalculTrajectoireARemplirSchema = extendApi(
  z.object({
    source: z.string(),
    emissions_ges: donneesARemplirResultSchema,
    consommations_finales: donneesARemplirResultSchema,
    sequestrations: donneesARemplirResultSchema,
  })
);
export type DonneesCalculTrajectoireARemplirType = z.infer<
  typeof donneesCalculTrajectoireARemplirSchema
>;

export const verificationDonneesSNBCResponseSchema = extendApi(
  z.object({
    status: z.nativeEnum(VerificationDonneesSNBCStatus).openapi({
      description:
        'Status de la vérification des données pour le calcul de la trajectoire SNBC',
    }),
    donnees_entree: donneesCalculTrajectoireARemplirSchema.optional().openapi({
      description:
        'Données qui seront utilisées pour le calcul de la trajectoire SNBC.',
    }),
    epci: epciSchema.optional().openapi({
      description: "Informations de l'EPCI",
    }),
    source_donnees_entree: z.string().optional().openapi({
      description:
        'Source des données utilisées lorsque le calcul a déjà été fait',
    }),
    indentifiants_referentiel_manquants_donnees_entree: z
      .array(z.string())
      .optional()
      .openapi({
        description:
          "Identifiants du référentiel manquants dans les données d'entrée lorsque le calcul a déjà été fait",
      }),
  })
);
export type VerificationDonneesSNBCResponseType = z.infer<
  typeof verificationDonneesSNBCResponseSchema
>;

export interface VerificationDonneesSNBCResult
  extends VerificationDonneesSNBCResponseType {
  valeurs?: IndicateurValeurType[];
}

export const calculTrajectoireRequestSchema = extendApi(
  collectiviteRequestSchema.extend({
    mode: z.nativeEnum(CalculTrajectoireReset).optional().openapi({
      description: 'Mode pour forcer la recréation de la trajectoire',
    }),
    force_utilisation_donnees_collectivite: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .openapi({
        description:
          "Force l'utilisation des données de la collectivité plutôt que celles du rare",
      }),
  })
);
export type CalculTrajectoireRequestType = z.infer<
  typeof calculTrajectoireRequestSchema
>;

export const calculTrajectoireResponseDonneesSchema = extendApi(
  z
    .object({
      emissions_ges: z.array(indicateurAvecValeursSchema),
      consommations_finales: z.array(indicateurAvecValeursSchema),
      sequestrations: z.array(indicateurAvecValeursSchema),
    })
    .openapi({
      title: 'Données de la trajectoire SNBC',
    })
);
export type CalculTrajectoireResponseDonneesType = z.infer<
  typeof calculTrajectoireResponseDonneesSchema
>;

export const calculTrajectoireResponseSchema = extendApi(
  z
    .object({
      mode: z.nativeEnum(CalculTrajectoireResultatMode),
      source_donnees_entree: z.string(),
      indentifiants_referentiel_manquants_donnees_entree: z.array(z.string()),
      trajectoire: calculTrajectoireResponseDonneesSchema,
    })
    .openapi({
      title: 'Réponse du calcul de la trajectoire SNBC',
    })
);
export type CalculTrajectoireResponseType = z.infer<
  typeof calculTrajectoireResponseSchema
>;

export interface CalculTrajectoireResultType
  extends CalculTrajectoireResponseType {
  spreadsheet_id: string;
}
