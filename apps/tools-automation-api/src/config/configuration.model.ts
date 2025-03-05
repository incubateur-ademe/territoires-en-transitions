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
});
export type ToolsAutomationApiConfigurationType = z.infer<
  typeof toolsAutomationApiConfigurationSchema
>;
