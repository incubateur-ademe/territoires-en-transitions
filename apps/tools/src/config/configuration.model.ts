import { stringToJSON } from '@/domain/utils';
import { z } from 'zod';

export const toolsAutomationApiConfigurationSchema = z.object({
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
  NOTION_BUG_DATABASE_ID: z
    .string()
    .min(1)
    .describe('ID de la base de données Notion dans laquelle créer les bugs'),
  NOTION_BUG_EPIC_ID: z
    .string()
    .min(1)
    .describe("ID de l'épic Notion dans laquel créer les bugs"),
  NOTION_BUG_TEMPLATE_ID: z
    .string()
    .min(1)
    .describe('ID du template de bug Notion'),
  TET_API_TOKEN: z
    .string()
    .min(1)
    .describe("Token pour l'authentification à l'API TeT"),
  TET_API_URL: z.string().min(1).describe("Url de l'API TeT"),
  MATTERMOST_NOTIFICATIONS_WEBHOOK_URL: z
    .string()
    .min(1)
    .describe('Url du webhook pour les notifications Mattermost'),
  QUEUE_REDIS_HOST: z
    .string()
    .min(1)
    .describe('Host du serveur Redis pour les queues Bull'),
  QUEUE_REDIS_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(6379)
    .describe('Port du serveur Redis pour les queues Bull'),
  SUPABASE_DATABASE_URL: z
    .string()
    .min(1)
    .describe('Database url to be able to persist webhook events'),
  EXTERNAL_SYSTEM_SECRET_MAP: stringToJSON().describe(
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
  CALENDLY_ACCESS_TOKEN: z
    .string()
    .min(1)
    .describe("Jeton d'accès à l'API Calendly"),
  ENABLE_CRON_JOBS: z.coerce.boolean().describe('Activer les cron jobs'),
  SIRENE_API_KEY: z.string().min(1).describe("Clé pour accéder à l'API SIRENE"),
  SIRENE_API_URL: z.string().min(1).describe("URL de l'API SIRENE"),
  SIRENE_AUTH_URL: z
    .string()
    .min(1)
    .describe("URL d'authentification à l'API SIRENE"),
  CONNECT_URL: z.string().min(1).describe("Adresse de l'API Connect"),
  CONNECT_CLIENT_ID: z
    .string()
    .min(1)
    .describe("Identifiant de connexion à l'API Connect"),
  CONNECT_CLIENT_SECRET: z
    .string()
    .min(1)
    .describe("Clé de connexion à l'API Connect"),
});
export type ToolsAutomationApiConfigurationType = z.infer<
  typeof toolsAutomationApiConfigurationSchema
>;
