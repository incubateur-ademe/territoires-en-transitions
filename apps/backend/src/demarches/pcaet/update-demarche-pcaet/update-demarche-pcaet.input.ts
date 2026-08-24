import { personneIdSchema } from '@tet/domain/collectivites';
import { demarchePcaetObligationValues } from '@tet/domain/demarches';
import { z } from 'zod';

export const updateDemarchePcaetInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  titre: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  obligation: z.enum(demarchePcaetObligationValues).optional(),
  launchedAt: z.iso.datetime({ offset: true }).nullish(),
  /**
   * Ensemble des plans rattachés au programme d'actions, remplacé tel quel :
   * un tableau vide détache tout.
   */
  planActionIds: z.array(z.number().int().positive()).optional(),
  pilotes: z.array(personneIdSchema).optional(),
});

export type UpdateDemarchePcaetInput = z.infer<
  typeof updateDemarchePcaetInputSchema
>;
