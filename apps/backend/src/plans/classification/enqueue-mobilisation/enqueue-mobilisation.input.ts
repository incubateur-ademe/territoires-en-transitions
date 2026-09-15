import { enjeuEnumValues } from '@tet/domain/shared';
import { z } from 'zod';

export const enqueueMobilisationInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  enjeu: z.enum(enjeuEnumValues),
});

export type EnqueueMobilisationInput = z.output<
  typeof enqueueMobilisationInputSchema
>;
