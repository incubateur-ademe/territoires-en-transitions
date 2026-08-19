import { VULNERABILITE_THEMATIQUE_LABEL_MAX } from '@tet/domain/demarches';
import { z } from 'zod';

/**
 * Ajout d'une thématique par la collectivité. Elle vaut pour toutes ses démarches,
 * mais se demande depuis celle en cours de saisie — d'où la démarche en entrée,
 * qui porte aussi le verrou d'élaboration.
 */
export const addVulnerabiliteThematiqueInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  label: z.string().trim().min(1).max(VULNERABILITE_THEMATIQUE_LABEL_MAX),
});

export type AddVulnerabiliteThematiqueInput = z.infer<
  typeof addVulnerabiliteThematiqueInputSchema
>;
