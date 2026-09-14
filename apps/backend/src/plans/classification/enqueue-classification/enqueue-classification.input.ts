import { enjeuEnumValues } from '@tet/domain/shared';
import { z } from 'zod';

export const enqueueClassificationInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  enjeu: z.enum(enjeuEnumValues),
});

export type EnqueueClassificationInput = z.output<
  typeof enqueueClassificationInputSchema
>;
