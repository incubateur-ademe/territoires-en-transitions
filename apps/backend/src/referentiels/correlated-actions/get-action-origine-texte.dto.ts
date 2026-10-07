import { actionOrigineTexteSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const getActionOrigineTexteDtoSchema = z.object({
  ...actionOrigineTexteSchema.shape,
  origineActionNom: z.string().optional().nullable(),
});
export type GetActionOrigineTexteDtoSchema = z.infer<
  typeof getActionOrigineTexteDtoSchema
>;
