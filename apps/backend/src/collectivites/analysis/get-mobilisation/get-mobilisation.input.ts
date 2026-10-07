import { enjeuEnumValues } from '@tet/domain/shared';
import { z } from 'zod';

export const getMobilisationInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  enjeu: z.enum(enjeuEnumValues),
});

export type GetMobilisationInput = z.output<typeof getMobilisationInputSchema>;
