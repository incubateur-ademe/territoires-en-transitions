import { z } from 'zod';

export const toolsAutomationApiConfigurationSchema = z
  .object({
    CRISP_TOKEN_IDENTIFIER: z
      .string()
      .min(1)
      .describe("Token identifier pour l'authentification à l'API Crisp"),
    CRISP_TOKEN_KEY: z
      .string()
      .min(1)
      .describe("Token key pour l'authentification à l'API Crisp"),
    NOTION_TOKEN: z
      .string()
      .min(1)
      .describe(
        "Token key pour l'authentification à l'API Notion pour la création de bug"
      ),
    NOTION_BUG_SUPPORT_DATABASE_ID: z
      .string()
      .min(1)
      .describe(
        'ID de la base de données Notion dans laquelle créer les bugs et les demandes de support'
      ),
    NOTION_BUG_TEMPLATE_ID: z
      .string()
      .min(1)
      .describe('ID du template de bug Notion'),
    NOTION_SUPPORT_TEMPLATE_ID: z
      .string()
      .min(1)
      .describe('ID du template de support Notion'),
    TET_API_TOKEN: z
      .string()
      .min(1)
      .describe("Token pour l'authentification à l'API TeT"),
    APP_URL: z
      .preprocess((value) => value || undefined, z.url().optional())
      .describe("URL de l'app, pour les liens envoyés dans Crisp"),
    TET_API_URL: z.string().min(1).describe("Url de l'API TeT"),
    // Requis sauf si QUEUE_REDIS_URL est fourni (cf. refine), comme côté backend.
    QUEUE_REDIS_HOST: z
      .string()
      .optional()
      .describe(
        'Host du serveur Redis pour les queues Bull, sans authentification (dev local, CI)'
      ),
    QUEUE_REDIS_URL: z
      .string()
      .optional()
      .describe(
        'URL Redis complète des queues Bull (redis:// ou rediss://user:password@host:port) ; prime sur QUEUE_REDIS_HOST et QUEUE_REDIS_PORT'
      ),
    QUEUE_REDIS_TLS_CA: z
      .string()
      .optional()
      .describe(
        'Certificat PEM du cluster Redis, épinglé en rediss:// ; requis pour un Redis managé Scaleway, dont le certificat est auto-signé'
      ),
    QUEUE_REDIS_PORT: z.coerce
      .number()
      .int()
      .positive()
      .prefault(6379)
      .describe('Port du serveur Redis pour les queues Bull'),
    SUPABASE_DATABASE_URL: z
      .string()
      .min(1)
      .describe('Database url to be able to persist webhook events'),
    EXTERNAL_SYSTEM_SECRET_MAP: z
      .json()
      .describe(
        `Clé valeur contenant les accès pour les appels vers les systèmes externes`
      ),
    AIRTABLE_PERSONAL_ACCESS_TOKEN: z
      .string()
      .min(1)
      .describe('Airtable personal access token'),
    AIRTABLE_IMPORT_DATABASE_ID: z
      .string()
      .min(1)
      .describe('Airtable import database id'),
    AIRTABLE_CRM_DATABASE_ID: z
      .string()
      .min(1)
      .describe('Airtable CRM database id'),
    AIRTABLE_CRM_FEEDBACKS_TABLE_ID: z
      .string()
      .min(1)
      .describe('Airtable CRM Feedbacks table id'),
    AIRTABLE_CRM_USERS_TABLE_ID: z
      .string()
      .min(1)
      .describe('Airtable CRM Users table id'),
    AIRTABLE_CRM_PROSPECTS_TABLE_ID: z
      .string()
      .min(1)
      .describe('Airtable CRM Prospects table id'),
    AIRTABLE_CRM_DATABASE_COLLECTIVITES_TABLE_ID: z
      .string()
      .optional()
      .describe(
        'Airtable table id des collectivités de la base CRM (lien depuis Crisp)'
      ),
    AIRTABLE_CRM_COLLECTIVITES_TABLE_ID: z
      .string()
      .min(1)
      .describe(
        'Airtable table id pour la synchro de la vue crm_collectivites'
      ),
    AIRTABLE_CRM_PERSONNES_TABLE_ID: z
      .string()
      .min(1)
      .describe('Airtable table id pour la synchro de la vue crm_personnes'),
    AIRTABLE_CRM_DROITS_TABLE_ID: z
      .string()
      .min(1)
      .describe('Airtable table id pour la synchro de la vue crm_droits'),
    AIRTABLE_CRM_LABELLISATIONS_TABLE_ID: z
      .string()
      .min(1)
      .describe(
        'Airtable table id pour la synchro de la vue crm_labellisations'
      ),
    AIRTABLE_CRM_USAGES_TABLE_ID: z
      .string()
      .min(1)
      .describe('Airtable table id pour la synchro de la vue crm_usages'),
    AIRTABLE_CRM_INDICATEURS_TABLE_ID: z
      .string()
      .min(1)
      .describe('Airtable table id pour la synchro de la vue crm_indicateurs'),
    AIRTABLE_CRM_PLANS_TABLE_ID: z
      .string()
      .min(1)
      .describe('Airtable table id pour la synchro de la vue crm_plans'),
    CALENDLY_ACCESS_TOKEN: z
      .string()
      .min(1)
      .describe("Jeton d'accès à l'API Calendly"),
    ENABLE_CRON_JOBS: z.coerce.boolean().describe('Activer les cron jobs'),
    CRON_JOBS_FILTER: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const items = val
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
        return items.length > 0 ? items : undefined;
      })
      .describe('Filtre pour les cron jobs'),
    SIRENE_API_KEY: z
      .string()
      .min(1)
      .describe("Clé pour accéder à l'API SIRENE"),
    SIRENE_API_URL: z.string().min(1).describe("URL de l'API SIRENE"),
    CONNECT_URL: z.string().min(1).describe("Adresse de l'API Connect"),
    CONNECT_CLIENT_ID: z
      .string()
      .min(1)
      .describe("Identifiant de connexion à l'API Connect"),
    CONNECT_CLIENT_SECRET: z
      .string()
      .min(1)
      .describe("Clé de connexion à l'API Connect"),
    POSTHOG_KEY: z
      .string()
      .optional()
      .describe('Clé projet PostHog pour la synchro du groupe collectivite'),
    POSTHOG_HOST: z.string().optional().describe('URL instance PostHog'),
  })
  .refine((config) => config.QUEUE_REDIS_HOST || config.QUEUE_REDIS_URL, {
    path: ['QUEUE_REDIS_HOST'],
    message: 'QUEUE_REDIS_HOST ou QUEUE_REDIS_URL est requis',
  });
export type ToolsAutomationApiConfigurationType = z.infer<
  typeof toolsAutomationApiConfigurationSchema
>;
