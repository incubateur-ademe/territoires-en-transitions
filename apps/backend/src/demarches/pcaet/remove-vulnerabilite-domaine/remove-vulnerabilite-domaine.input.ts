import { z } from 'zod';

/**
 * Suppression d'un domaine ajouté par la collectivité. Elle emporte les valeurs
 * saisies dans toutes ses démarches, y compris celles déjà adoptées.
 */
export const removeVulnerabiliteDomaineInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  domaineId: z.number().int().positive(),
});

export type RemoveVulnerabiliteDomaineInput = z.infer<
  typeof removeVulnerabiliteDomaineInputSchema
>;
