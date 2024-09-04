import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { personnalisationRegleSchema } from './personnalisation-regle.table';

export const getPersonnalisationReglesResponseSchema = extendApi(
  z.object({
    regles: z.array(personnalisationRegleSchema),
  }),
).openapi({
  description: 'Liste des regles de personnalisation',
  title: 'Liste des regles de personnalisation',
});
export type GetPersonnalisationReglesResponseType = z.infer<
  typeof getPersonnalisationReglesResponseSchema
>;
