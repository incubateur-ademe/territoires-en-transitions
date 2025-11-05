import { z } from 'zod';

export enum AppEnvironment {
  DEV = 'dev',
  PREPROD = 'preprod',
  PROD = 'prod',
  STAGING = 'staging',
}

export const versionResponseSchema = z.object({
  version: z.string().optional(),
  environment: z.enum(AppEnvironment).optional(),
  commit: z.string().optional(),
  commit_time: z.string().optional(),
  deploy_time: z.string().optional(),
});

export type VersionResponseType = z.infer<typeof versionResponseSchema>;


