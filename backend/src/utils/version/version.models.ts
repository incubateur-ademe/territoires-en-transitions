import { z } from 'zod';

export enum AppEnvironment {
  DEV = 'dev',
  PREPROD = 'preprod',
  PROD = 'prod',
}

export const versionResponseSchema = z.object({
  version: z.string().describe('Application version'),
  environment: z
    .nativeEnum(AppEnvironment)
    .describe('Environnement de déploiement'),
  commit: z.string().describe('Hash court du commit'),
  commit_time: z.string().describe('Date de commit au format ISO 8601'),
  deploy_time: z.string().describe('Date de déploiement au format ISO 8601'),
});
export type VersionResponseType = z.infer<typeof versionResponseSchema>;
