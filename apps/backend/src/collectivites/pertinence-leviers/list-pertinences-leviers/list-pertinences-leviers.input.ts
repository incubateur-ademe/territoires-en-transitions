import { enjeuEnumValues } from '@tet/domain/shared';
import { z } from 'zod';

export const listPertinencesLeviersInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  enjeu: z.enum(enjeuEnumValues),
});

export type ListPertinencesLeviersInput = z.output<
  typeof listPertinencesLeviersInputSchema
>;
