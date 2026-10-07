import { z } from 'zod';

/**
 * Suppression d'une thématique ajoutée par la collectivité. Elle la retire de la
 * démarche courante sans affecter les autres démarches qui le rattachent.
 */
export const removeVulnerabiliteThematiqueInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  thematiqueId: z.number().int().positive(),
});

export type RemoveVulnerabiliteThematiqueInput = z.infer<
  typeof removeVulnerabiliteThematiqueInputSchema
>;
