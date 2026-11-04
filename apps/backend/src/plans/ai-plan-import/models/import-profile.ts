import { z } from 'zod';

export const aiPlanImportProfileSchema = z.enum([
  'generic',
  'annexe-3-electrification',
]);

export type AiPlanImportProfile = z.infer<typeof aiPlanImportProfileSchema>;

export const GENERIC_IMPORT_CONTRACT_VERSION = 1;

/** Seuls les jobs sans profil sont historiques ; un profil inconnu ne l'est pas. */
export function resolveImportProfile(
  profile: unknown
): AiPlanImportProfile | null {
  if (profile === undefined) return 'generic';
  const parsed = aiPlanImportProfileSchema.safeParse(profile);
  return parsed.success ? parsed.data : null;
}

/** L'annexe reste fermée tant que son traitement complet n'est pas livré. */
export function isImportProfileImplemented(
  profile: AiPlanImportProfile
): boolean {
  return profile === 'generic';
}
