import {
  AiPlanImportProfileEnum,
  aiPlanImportProfileSchema,
  type AiPlanImportProfile,
} from '@tet/domain/plans';

export {
  AiPlanImportProfileEnum,
  aiPlanImportProfileSchema,
  aiPlanImportProfileValues,
  type AiPlanImportProfile,
} from '@tet/domain/plans';

export const GENERIC_IMPORT_CONTRACT_VERSION = 1;

/** Seuls les jobs sans profil sont historiques ; un profil inconnu ne l'est pas. */
export function resolveImportProfile(
  profile: unknown
): AiPlanImportProfile | null {
  if (profile === undefined) return AiPlanImportProfileEnum.GENERIC;
  const parsed = aiPlanImportProfileSchema.safeParse(profile);
  return parsed.success ? parsed.data : null;
}
