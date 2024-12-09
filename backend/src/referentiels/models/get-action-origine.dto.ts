import { z } from 'zod';
import { actionOrigineSchema } from '../../../../packages/domain/src/referentiels/models/action-origine.table';

export const getActionOrigineDtoSchema = actionOrigineSchema.extend({
  origineActionNom: z.string().optional().nullable(),
});
export type GetActionOrigineDtoSchema = z.infer<
  typeof getActionOrigineDtoSchema
>;
