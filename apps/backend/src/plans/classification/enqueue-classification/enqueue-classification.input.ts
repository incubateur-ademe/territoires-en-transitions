import { enjeuEnumValues } from '@tet/domain/shared';
import { z } from 'zod';

export const enqueueClassificationInputSchema = z.object({
  planId: z.number().int().positive(),
  enjeu: z.enum(enjeuEnumValues),
});

export type EnqueueClassificationInput = z.output<
  typeof enqueueClassificationInputSchema
>;
