import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { indicateurAvecValeursParSourceSchema } from './indicateur-valeur.table';


export const getIndicateursValeursResponseSchema = extendApi(
  z
    .object({
      indicateurs: z.array(indicateurAvecValeursParSourceSchema),
    })
    .openapi({
      title: 'Valeurs par indicateur et par source',
    })
);

export type GetIndicateursValeursResponseType = z.infer<
  typeof getIndicateursValeursResponseSchema
>;
