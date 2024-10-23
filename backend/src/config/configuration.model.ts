import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const backendConfigurationSchema = z.object({
  SUPABASE_DATABASE_URL: z.string().min(1).openapi({
    description:
      'Url de connexion complète à la base de données Postgres Supabase (postgres://)',
  }),
  SUPABASE_JWT_SECRET: z.string().min(1).openapi({
    description:
      "Clé secrète pour la génération des JWT pour l'authentification Supabase",
  }),
  SUPABASE_URL: z.string().min(1).openapi({
    description:
      "Url de connexion à l'API Supabase. Utilisé pour initialiser le client supabase indépendamment de la base de données",
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).openapi({
    description:
      "Clé pour la connexion à l'API Supabase. Utilisé pour initialiser le client supabase indépendamment de la base de données",
  }),
  GCLOUD_SERVICE_ACCOUNT_KEY: z.string().min(1).openapi({
    description:
      "Clé du compte de service Google Cloud pour l'accès aux api drive et sheets",
  }),
  TRAJECTOIRE_SNBC_SHEET_ID: z.string().min(1).openapi({
    description:
      'Identifiant de la feuille de calcul Google Sheets pour le calcul de la trajectoire SNBC',
  }),
  TRAJECTOIRE_SNBC_XLSX_ID: z.string().min(1).openapi({
    description:
      'Identifiant de la feuille de calcul Xlsx pour le téléchargement de la trajectoire SNBC en conservant les styles',
  }),
  TRAJECTOIRE_SNBC_RESULT_FOLDER_ID: z.string().min(1).openapi({
    description:
      'Identifiant du dossier Google Drive pour le stockage des résultats de calcul de la trajectoire SNBC',
  }),
  DIRECTUS_API_KEY: z.string().min(1).openapi({
    description: "Clé pour la connexion à l'api de Directus",
  }),
  BREVO_API_KEY: z.string().min(1).openapi({
    description: "Clé pour la connexion à l'api de Brevo",
  }),
});
export type BackendConfigurationType = z.infer<
  typeof backendConfigurationSchema
>;
