import { z } from 'zod';
import { actionOrigineSchema } from '../shared/models/action-origine.table';

export const getActionOrigineDtoSchema = actionOrigineSchema.extend({
  origineActionNom: z.string().optional().nullable(),
});
export type GetActionOrigineDtoSchema = z.infer<
  typeof getActionOrigineDtoSchema
>;
