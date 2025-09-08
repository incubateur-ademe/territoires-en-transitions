import { z } from 'zod';
import { indicateurAvecValeursParSourceSchema } from './indicateur-valeur.table';

export const getIndicateursValeursResponseSchema = z
  .object({
    count: z.number().int(),
    indicateurs: z.array(indicateurAvecValeursParSourceSchema),
  })
  .describe('Valeurs par indicateur et par source');

export type GetIndicateursValeursResponseType = z.infer<
  typeof getIndicateursValeursResponseSchema
>;
