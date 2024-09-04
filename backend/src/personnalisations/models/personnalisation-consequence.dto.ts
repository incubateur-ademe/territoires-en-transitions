import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
extendZodWithOpenApi(z);

export const personnalisationConsequenceSchema = extendApi(
  z
    .object({
      desactive: z.boolean().nullable(),
      score_formule: z.string().nullable(),
      potentiel_perso: z.number().nullable(),
    })
    .openapi({
      title:
        'Consequence des règles de personnalisation pour une action donnée',
    }),
);

export type PersonnalisationConsequenceType = z.infer<
  typeof personnalisationConsequenceSchema
>;
