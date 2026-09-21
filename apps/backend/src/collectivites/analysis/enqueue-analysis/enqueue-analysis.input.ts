import { enjeuEnumValues } from '@tet/domain/shared';
import { z } from 'zod';

export const enqueueAnalysisInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  enjeu: z.enum(enjeuEnumValues),
});

export type EnqueueAnalysisInput = z.output<typeof enqueueAnalysisInputSchema>;
