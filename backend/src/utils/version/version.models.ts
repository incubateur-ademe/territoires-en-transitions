import { z } from 'zod';

export enum AppEnvironment {
  DEV = 'dev',
  PREPROD = 'preprod',
  PROD = 'prod',
  STAGING = 'staging',
}

export const versionResponseSchema = z.object({
  version: z.string().optional().describe('Application version'),
  environment: z
    .nativeEnum(AppEnvironment)
    .optional()
    .describe('Environnement de déploiement'),
  commit: z.string().optional().describe('Hash court du commit'),
  commit_time: z
    .string()
    .optional()
    .describe('Date de commit au format ISO 8601'),
  deploy_time: z
    .string()
    .optional()
    .describe('Date de déploiement au format ISO 8601'),
});
export type VersionResponseType = z.infer<typeof versionResponseSchema>;
