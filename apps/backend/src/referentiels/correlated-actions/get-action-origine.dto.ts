import { actionOrigineSchema } from '@/domain/referentiels';
import { z } from 'zod';

export const getActionOrigineDtoSchema = z.object({
  ...actionOrigineSchema.shape,
  origineActionNom: z.string().optional().nullable(),
});
export type GetActionOrigineDtoSchema = z.infer<
  typeof getActionOrigineDtoSchema
>;
