import { enjeuEnumValues } from '@tet/domain/shared';
import { z } from 'zod';

export const getLastAnalysisInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  enjeu: z.enum(enjeuEnumValues),
});

export type GetLastAnalysisInput = z.output<typeof getLastAnalysisInputSchema>;
