import { z } from 'zod';
import { actionOrigineSchema } from './action-origine.table';

export const getActionOrigineDtoSchema = actionOrigineSchema.extend({
  origine_action_nom: z.string().optional().nullable(),
});
export type GetActionOrigineDtoSchema = z.infer<
  typeof getActionOrigineDtoSchema
>;
