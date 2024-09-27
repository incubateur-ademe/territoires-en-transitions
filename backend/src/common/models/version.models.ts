import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
extendZodWithOpenApi(z);

export enum AppEnvironment {
  DEV = 'dev',
  PREPROD = 'preprod',
  PROD = 'prod',
}

export const versionResponseSchema = extendApi(
  z.object({
    version: z.string().openapi({
      description: 'Application version',
    }),
    environment: z.nativeEnum(AppEnvironment).openapi({
      description: 'Environnement de déploiement',
    }),
    commit: z.string().openapi({
      description: 'Hash court du commit',
    }),
    commit_time: z.string().openapi({
      description: 'Date de commit au format ISO 8601',
    }),
    deploy_time: z.string().openapi({
      description: 'Date de déploiement au format ISO 8601',
    }),
  }),
);
export type VersionResponseType = z.infer<typeof versionResponseSchema>;
