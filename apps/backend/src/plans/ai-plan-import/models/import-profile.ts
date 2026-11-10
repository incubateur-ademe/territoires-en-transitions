import { z } from 'zod';

export const AiPlanImportProfileEnum = {
  GENERIC: 'generic',
  // Valeur sérialisée conservée pour le contrat API et les options des jobs.
  ELECTRIFICATION: 'annexe-3-electrification',
} as const;

export const aiPlanImportProfileValues = [
  AiPlanImportProfileEnum.GENERIC,
  AiPlanImportProfileEnum.ELECTRIFICATION,
] as const;

export const aiPlanImportProfileSchema = z.enum(aiPlanImportProfileValues);

export type AiPlanImportProfile = z.infer<typeof aiPlanImportProfileSchema>;

export const GENERIC_IMPORT_CONTRACT_VERSION = 1;

/** Seuls les jobs sans profil sont historiques ; un profil inconnu ne l'est pas. */
export function resolveImportProfile(
  profile: unknown
): AiPlanImportProfile | null {
  if (profile === undefined) return AiPlanImportProfileEnum.GENERIC;
  const parsed = aiPlanImportProfileSchema.safeParse(profile);
  return parsed.success ? parsed.data : null;
}
