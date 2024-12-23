import { z } from 'zod';

export const backendConfigurationSchema = z.object({
  SUPABASE_DATABASE_URL: z
    .string()
    .min(1)
    .describe(
      'Url de connexion complète à la base de données Postgres Supabase (postgres://)'
    ),
  SUPABASE_JWT_SECRET: z
    .string()
    .min(1)
    .describe(
      "Clé secrète pour la génération des JWT pour l'authentification Supabase"
    ),
  SUPABASE_URL: z
    .string()
    .min(1)
    .describe(
      "Url de connexion à l'API Supabase. Utilisé pour initialiser le client supabase indépendamment de la base de données"
    ),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1)
    .describe(
      "Clé pour la connexion à l'API Supabase. Utilisé pour initialiser le client supabase indépendamment de la base de données"
    ),
  SUPABASE_ANON_KEY: z
    .string()
    .min(1)
    .describe(
      "Clé pour la connexion à l'API Supabase en tant qu'utilisateur anonyme, permet de générér des urls d'accès anonyme"
    ),
  GCLOUD_SERVICE_ACCOUNT_KEY: z
    .string()
    .min(1)
    .describe(
      "Clé du compte de service Google Cloud pour l'accès aux api drive et sheets"
    ),
  TRAJECTOIRE_SNBC_SHEET_ID: z
    .string()
    .min(1)
    .describe(
      'Identifiant de la feuille de calcul Google Sheets pour le calcul de la trajectoire SNBC'
    ),
  TRAJECTOIRE_SNBC_XLSX_ID: z
    .string()
    .min(1)
    .describe(
      'Identifiant de la feuille de calcul Xlsx pour le téléchargement de la trajectoire SNBC en conservant les styles'
    ),
  TRAJECTOIRE_SNBC_RESULT_FOLDER_ID: z
    .string()
    .min(1)
    .describe(
      'Identifiant du dossier Google Drive pour le stockage des résultats de calcul de la trajectoire SNBC'
    ),
  DIRECTUS_API_KEY: z
    .string()
    .min(1)
    .describe("Clé pour la connexion à l'api de Directus"),
  BREVO_API_KEY: z
    .string()
    .min(1)
    .describe("Clé pour la connexion à l'api de Brevo"),
  REFERENTIEL_TE_SHEET_ID: z
    .string()
    .min(1)
    .describe(
      "Identifiant de la feuille de calcul Google Sheets pour l'import du nouveau référentiel"
    ),
  MATTERMOST_NOTIFICATIONS_WEBHOOK_URL: z
    .string()
    .optional()
    .describe('Url du webhook pour les notifications Mattermost'),
});
export type BackendConfigurationType = z.infer<
  typeof backendConfigurationSchema
>;
