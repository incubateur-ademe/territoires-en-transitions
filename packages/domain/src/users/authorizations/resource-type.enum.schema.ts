import { z } from 'zod/mini';

export const ResourceType = {
  PLATEFORME: 'Plateforme',
  COLLECTIVITE: 'Collectivité',
  AUDIT: 'Audit',
  REFERENTIEL: 'Référentiel',
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export const resourceTypeSchema = z.enum(ResourceType);
