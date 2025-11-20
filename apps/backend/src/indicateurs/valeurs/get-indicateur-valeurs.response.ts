import { indicateurAvecValeursParSourceSchema } from '@tet/domain/indicateurs';
import { z } from 'zod';

export const getIndicateursValeursResponseSchema = z
  .object({
    count: z.int(),
    indicateurs: z.array(indicateurAvecValeursParSourceSchema),
  })
  .describe('Valeurs par indicateur et par source');

export type GetIndicateursValeursResponse = z.infer<
  typeof getIndicateursValeursResponseSchema
>;
