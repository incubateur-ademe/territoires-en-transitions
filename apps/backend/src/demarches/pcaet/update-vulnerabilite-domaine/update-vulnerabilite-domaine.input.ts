import { VULNERABILITE_DOMAINE_LABEL_MAX } from '@tet/domain/demarches';
import { z } from 'zod';

/** Renommage d'un domaine ajouté par la collectivité. Le socle est intouchable. */
export const updateVulnerabiliteDomaineInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  domaineId: z.number().int().positive(),
  label: z.string().trim().min(1).max(VULNERABILITE_DOMAINE_LABEL_MAX),
});

export type UpdateVulnerabiliteDomaineInput = z.infer<
  typeof updateVulnerabiliteDomaineInputSchema
>;
