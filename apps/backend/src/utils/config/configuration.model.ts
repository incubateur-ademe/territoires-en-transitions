import { z } from 'zod';

export const backendConfigurationSchema = z.object({
  APP_URL: z.string().min(1).describe('Main front app URL'),
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
  // TODO(import-ia) : passer GOOGLE_API_KEY et GEMINI_MODEL en .min(1) (requis au boot)
  // quand l'import IA est câblé en prod (worker + endpoints). Optionnelles pour l'instant
  // car le LlmModule n'est encore consommé nulle part — les rendre requises casserait
  // le démarrage du backend pour tous les environnements sans clé Gemini.
  GOOGLE_API_KEY: z
    .string()
    .optional()
    .describe(
      "Clé API Google Generative Language (Gemini) pour l'import IA de plan d'action"
    ),
  GEMINI_MODEL: z
    .string()
    .optional()
    .describe(
      "Identifiant du modèle Gemini pour l'import IA (ex : gemini-2.5-pro) ; requis à l'usage"
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
  REFERENTIEL_CAE_SHEET_ID: z
    .string()
    .min(1)
    .describe(
      "Identifiant de la feuille de calcul Google Sheets pour l'import du référentiel CAE"
    ),
  REFERENTIEL_ECI_SHEET_ID: z
    .string()
    .min(1)
    .describe(
      "Identifiant de la feuille de calcul Google Sheets pour l'import du référentiel ECI"
    ),
  INDICATEUR_DEFINITIONS_SHEET_ID: z
    .string()
    .optional()
    .describe(
      "Identifiant de la feuille de calcul Google Sheets pour l'import des définitions d'indicateurs"
    ),
  PERSONNALISATION_QUESTIONS_SHEET_ID: z
    .string()
    .min(1)
    .describe(
      "Identifiant de la feuille de calcul Google Sheets pour l'import des questions de personnalisation"
    ),
  MATTERMOST_NOTIFICATIONS_WEBHOOK_URL: z
    .string()
    .optional()
    .describe('Url du webhook pour les notifications Mattermost'),
  QUEUE_REDIS_HOST: z
    .string()
    .min(1)
    .describe('Host du serveur Redis pour les queues Bull'),
  QUEUE_REDIS_PORT: z.coerce
    .number()
    .int()
    .positive()
    .prefault(6379)
    .describe('Port du serveur Redis pour les queues Bull'),
  PUBLIC_API_THROTTLE_TTL: z.coerce
    .number()
    .int()
    .positive()
    .prefault(60000)
    .describe('The throttle TTL in milliseconds'),
  PUBLIC_API_THROTTLE_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .prefault(100)
    .describe('The throttle limit'),
  POSTHOG_KEY: z.string().optional().describe('The PostHog key'),
  POSTHOG_HOST: z.string().optional().describe('The PostHog host'),
  SMTP_URL: z
    .string()
    .optional()
    .describe('SMTP API URL (smtp://<username>@<host>:<port>)'),
  SMTP_KEY: z.string().optional().describe('SMTP API key'),
  SMTP_FROM: z
    .string()
    .optional()
    .default('Plateforme TET <notifications@territoiresentransitions.fr>')
    .describe('SMTP sender name and address'),
  SMTP_TO_EMAIL_WHITELIST: z
    .string()
    .transform((val) => val.split(',').map((v) => v.trim()))
    .optional()
    .describe(
      'List of email addresses that are allowed to receive emails sent by the SMTP server'
    ),
  // Contournement de démonstration : renseigner un diagnostic PCAET entier
  // (plusieurs centaines de lignes d'indicateurs) n'est pas tenable en COPIL.
  // Réservé aux environnements de démonstration — laissé à false partout
  // ailleurs, la règle de complétude du dossier s'applique alors normalement.
  DEMARCHE_PCAET_BYPASS_DIAGNOSTIC: z
    .stringbool()
    .default(false)
    .describe(
      'Environnements de démonstration uniquement : dispense le dossier PCAET d’un diagnostic complet pour être transmis pour avis'
    ),
  DELAY_IN_MIN_BEFORE_NOTIFY_PILOTE: z.coerce
    .number()
    .int()
    .positive()
    .prefault(15)
    .describe(
      "Délai en minutes avant envoi de la notification d'assignation comme pilote d'une action"
    ),
  // Authentification externe OIDC — ProConnect.
  // PRO_CONNECT_ENABLED=false par défaut : les endpoints /proconnect/* sont
  // inertes (404) tant que le flag est désactivé. Les autres variables
  // sont optionnelles au boot pour ne pas casser le démarrage des
  // environnements sans ProConnect ; elles sont requises à l'usage quand le
  // flag est activé (mirroir du style GOOGLE_API_KEY / GEMINI_MODEL).
  PRO_CONNECT_ENABLED: z
    .stringbool()
    .prefault('false')
    .describe(
      'Active les endpoints OIDC ProConnect (endpoints inertes si false)'
    ),
  PRO_CONNECT_ISSUER: z
    .url()
    .optional()
    .describe(
      "Issuer OIDC ProConnect (ex : https://fca.integ01.dev-agentconnect.fr/api/v2) ; requis à l'usage"
    ),
  PRO_CONNECT_CLIENT_ID: z
    .string()
    .optional()
    .describe("Client id ProConnect ; requis à l'usage"),
  PRO_CONNECT_CLIENT_SECRET: z
    .string()
    .optional()
    .describe(
      "Client secret ProConnect (ne quitte jamais le serveur) ; requis à l'usage"
    ),
  PRO_CONNECT_REDIRECT_URI: z
    .url()
    .optional()
    .describe(
      "URI de callback déclarée auprès de ProConnect (correspondance exacte requise, ex : http://localhost:8080/proconnect/callback) ; requis à l'usage"
    ),
  PRO_CONNECT_POST_LOGOUT_REDIRECT_URI: z
    .url()
    .optional()
    .describe(
      'URI de retour après déconnexion ProConnect (déclarée auprès du provider)'
    ),
  // Authentification externe OIDC — MonCompteAdeme (MCA, second provider).
  // Même contrat que ProConnect : désactivé par défaut (endpoints inertes),
  // variables optionnelles au boot, requises à l'usage quand le flag est
  // activé. MCA est indépendant de ProConnect (on peut activer l'un sans
  // l'autre).
  MON_COMPTE_ADEME_ENABLED: z
    .stringbool()
    .prefault('false')
    .describe(
      'Active les endpoints OIDC MonCompteAdeme (endpoints inertes si false)'
    ),
  MON_COMPTE_ADEME_ISSUER: z
    .url()
    .optional()
    .describe(
      "Issuer OIDC MonCompteAdeme (ex : https://rec-fa.ademe.fr/auth/realms/integration) ; requis à l'usage"
    ),
  MON_COMPTE_ADEME_CLIENT_ID: z
    .string()
    .optional()
    .describe("Client id MonCompteAdeme ; requis à l'usage"),
  MON_COMPTE_ADEME_CLIENT_SECRET: z
    .string()
    .optional()
    .describe(
      "Client secret MonCompteAdeme (ne quitte jamais le serveur) ; requis à l'usage"
    ),
  MON_COMPTE_ADEME_REDIRECT_URI: z
    .url()
    .optional()
    .describe(
      "URI de callback déclarée auprès de MonCompteAdeme (correspondance exacte requise, ex : http://localhost:8080/api/v1/moncompteademe/callback) ; requis à l'usage"
    ),
  MON_COMPTE_ADEME_POST_LOGOUT_REDIRECT_URI: z
    .url()
    .optional()
    .describe(
      'URI de retour après déconnexion MonCompteAdeme (déclarée auprès du provider)'
    ),
  // Ticket signé du parcours OIDC (cas 3) — commun à tous les providers
  // (ProConnect puis MonCompteAdeme). Requis à l'usage dès qu'un provider OIDC
  // est activé.
  OIDC_TICKET_SECRET: z
    .string()
    .optional()
    .describe(
      "Secret de signature du ticket OIDC (claims vérifiés en attente de la réponse à la dialog de bienvenue) ; requis à l'usage"
    ),
})
  // Fail-fast au démarrage : un provider OIDC activé (`*_ENABLED`) sans sa config
  // complète serait sinon silencieusement inerte (404) ; le ticket OIDC lèverait
  // une erreur nue à l'usage. On rend donc ces valeurs requises *conditionnellement*
  // à l'activation, sans impacter les environnements où le provider est désactivé.
  .superRefine((config, ctx) => {
    const values = config as Record<string, unknown>;
    const requisParProvider: Array<[boolean, string[]]> = [
      [
        config.PRO_CONNECT_ENABLED,
        [
          'PRO_CONNECT_ISSUER',
          'PRO_CONNECT_CLIENT_ID',
          'PRO_CONNECT_CLIENT_SECRET',
          'PRO_CONNECT_REDIRECT_URI',
        ],
      ],
      [
        config.MON_COMPTE_ADEME_ENABLED,
        [
          'MON_COMPTE_ADEME_ISSUER',
          'MON_COMPTE_ADEME_CLIENT_ID',
          'MON_COMPTE_ADEME_CLIENT_SECRET',
          'MON_COMPTE_ADEME_REDIRECT_URI',
        ],
      ],
    ];

    for (const [enabled, fields] of requisParProvider) {
      if (!enabled) continue;
      for (const field of fields) {
        if (!values[field]) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: `${field} est requis quand le provider OIDC associé est activé`,
          });
        }
      }
    }

    if (
      (config.PRO_CONNECT_ENABLED || config.MON_COMPTE_ADEME_ENABLED) &&
      !config.OIDC_TICKET_SECRET
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['OIDC_TICKET_SECRET'],
        message: "OIDC_TICKET_SECRET est requis quand un provider OIDC est activé",
      });
    }
  });
export type BackendConfigurationType = z.infer<
  typeof backendConfigurationSchema
>;
