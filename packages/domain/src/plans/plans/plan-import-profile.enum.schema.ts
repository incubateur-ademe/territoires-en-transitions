import { z } from 'zod';

export const AiPlanImportProfileEnum = {
  GENERIC: 'generic',
  PCAET: 'pcaet',
  // Identifiant public déjà utilisé par l'API et les jobs persistés.
  ELECTRIFICATION: 'annexe-3-electrification',
} as const;

export const aiPlanImportProfileValues = [
  AiPlanImportProfileEnum.GENERIC,
  AiPlanImportProfileEnum.PCAET,
  AiPlanImportProfileEnum.ELECTRIFICATION,
] as const;

export const aiPlanImportProfileSchema = z.enum(aiPlanImportProfileValues);
export type AiPlanImportProfile = z.infer<typeof aiPlanImportProfileSchema>;
