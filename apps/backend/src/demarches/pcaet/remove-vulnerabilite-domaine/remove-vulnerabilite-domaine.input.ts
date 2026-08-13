import { z } from 'zod';

/**
 * Suppression d'un domaine ajouté par la collectivité. Elle le retire de la
 * démarche courante sans affecter les autres démarches qui le rattachent.
 */
export const removeVulnerabiliteDomaineInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  domaineId: z.number().int().positive(),
});

export type RemoveVulnerabiliteDomaineInput = z.infer<
  typeof removeVulnerabiliteDomaineInputSchema
>;
