import {
  planDatesSchema,
  refinePlanDates,
} from '@tet/backend/plans/plans/upsert-plan/upsert-plan.input';
import { personneIdSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

/**
 * Pas de typeId : le type PCAET est résolu et imposé côté serveur par sa clé
 * fonctionnelle (voir PCAET_PLAN_TYPE_KEY dans le domaine).
 */
export const createAndLinkPlanInputSchema = z
  .object({
    collectiviteId: z.number().int().positive(),
    demarcheId: z.number().int().positive(),
    nom: z.string().trim().min(1).optional(),
    referents: z.array(personneIdSchema).optional(),
    pilotes: z.array(personneIdSchema).optional(),
    ...planDatesSchema,
  })
  .superRefine(refinePlanDates);

export type CreateAndLinkPlanInput = z.infer<
  typeof createAndLinkPlanInputSchema
>;
