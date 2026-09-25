import { z } from 'zod';

export const backendConfigurationSchema = z
  .object({
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
        "Clé du compte de service Google Cloud pour l'accès aux api drive, sheets et Vertex AI"
      ),
    // TODO(import-ia) : passer GOOGLE_API_KEY et GEMINI_MODEL en .min(1) (requis au boot)
    // une fois les clés présentes sur tous les environnements : les rendre requises
    // casserait le démarrage du backend partout où la clé Gemini manque.
    GOOGLE_API_KEY: z
      .string()
      .optional()
      .describe(
        "Clé API Google Generative Language (Gemini) pour l'import IA de plan d'action ; ignorée quand Vertex AI est configuré"
      ),
    // Vertex AI s'authentifie avec le compte de service de GCLOUD_SERVICE_ACCOUNT_KEY
    // (cf. initGoogleCloudCredentials) : aucun secret de plus, juste le projet et la région.
    GOOGLE_CLOUD_PROJECT: z
      .string()
      .optional()
      .describe(
        'Projet Google Cloud qui porte Vertex AI (Gemini) ; avec GOOGLE_CLOUD_LOCATION, prime sur GOOGLE_API_KEY'
      ),
    GOOGLE_CLOUD_LOCATION: z
      .string()
      .optional()
      .describe(
        'Région Vertex AI (ex : eu, multi-région UE, ou global) ; requise avec GOOGLE_CLOUD_PROJECT'
      ),
    GEMINI_MODEL: z
      .string()
      .optional()
      .describe(
        "Identifiant du modèle Gemini pour l'import IA (ex : gemini-3.5-flash) ; requis à l'usage"
      ),
    // Fournisseur des appels LLM (import IA, analyse des collectivités). Albert
    // API par défaut ; gemini reste disponible en secours, le retour arrière se
    // fait par cette seule variable.
    LLM_PROVIDER: z
      .enum(['gemini', 'albert'])
      .default('albert')
      .describe(
        'Fournisseur LLM : gemini (Vertex AI) ou albert (Albert API, socle interministériel de la DINUM)'
      ),
    ALBERT_API_KEY: z
      .string()
      .optional()
      .describe(
        "Clé d'API Albert (sk-…, expire au plus tard un an après sa création) ; requise avec LLM_PROVIDER=albert"
      ),
    ALBERT_API_BASE_URL: z
      .string()
      .default('https://albert.api.etalab.gouv.fr/v1')
      .describe("URL de base de l'API Albert, compatible OpenAI"),
    // Contexte de 131 072 tokens pour gpt-oss-120b : il faut y loger la sortie
    // (DEFAULT_MAX_OUTPUT_TOKENS) et les consignes des prompts.
    ALBERT_MAX_INPUT_TOKENS: z.coerce
      .number()
      .int()
      .positive()
      .prefault(60000)
      .describe(
        'Taille maximale estimée, en tokens, du document envoyé au modèle Albert'
      ),
    ALBERT_MAX_CONCURRENT_CALLS: z.coerce
      .number()
      .int()
      .positive()
      .prefault(2)
      .describe(
        "Appels simultanés vers Albert API, tous imports confondus : 10 à 50 requêtes par minute selon l'offre"
      ),
    ALBERT_MODEL: z
      .string()
      .optional()
      .describe(
        'Identifiant du modèle Albert (ex : openai/gpt-oss-120b) ; requis avec LLM_PROVIDER=albert'
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
    DELAY_IN_MIN_BEFORE_NOTIFY_PILOTE: z.coerce
      .number()
      .int()
      .positive()
      .prefault(15)
      .describe(
        "Délai en minutes avant envoi de la notification d'assignation comme pilote d'une action"
      ),
    // Contournement du diagnostic PCAET : même effet que le feature flag PostHog
    // `is-demarche-pcaet-bypass-diagnostic-enabled`, mais sans PostHog. Prévu
    // pour le développement local et les démonstrations, où le flag n'est pas
    // évaluable (clé PostHog absente, ou utilisateur inconnu du projet).
    DEMARCHE_PCAET_BYPASS_DIAGNOSTIC: z
      .stringbool()
      .prefault('false')
      .describe(
        'Force le contournement du diagnostic PCAET pour tous les utilisateurs de cette instance (démonstration / dev local)'
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
        message:
          'OIDC_TICKET_SECRET est requis quand un provider OIDC est activé',
      });
    }
  });
export type BackendConfigurationType = z.infer<
  typeof backendConfigurationSchema
>;
