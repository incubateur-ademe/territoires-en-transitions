import { VULNERABILITE_THEMATIQUE_LABEL_MAX } from '@tet/domain/demarches';
import { z } from 'zod';

/** Renommage d'une thématique ajoutée par la collectivité. Le socle est intouchable. */
export const updateVulnerabiliteThematiqueInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  thematiqueId: z.number().int().positive(),
  label: z.string().trim().min(1).max(VULNERABILITE_THEMATIQUE_LABEL_MAX),
});

export type UpdateVulnerabiliteThematiqueInput = z.infer<
  typeof updateVulnerabiliteThematiqueInputSchema
>;
