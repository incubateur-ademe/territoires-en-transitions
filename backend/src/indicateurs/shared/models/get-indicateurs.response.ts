import { indicateurAvecValeursParSourceSchema } from '@/backend/indicateurs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const getIndicateursValeursResponseSchema = extendApi(
  z
    .object({
      indicateurs: z.array(indicateurAvecValeursParSourceSchema),
    })
    .describe('Valeurs par indicateur et par source')
);

export type GetIndicateursValeursResponseType = z.infer<
  typeof getIndicateursValeursResponseSchema
>;
