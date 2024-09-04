import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { ReferentielType } from '../../referentiels/models/referentiel.enum';
import { getPersonnalisationReponsesRequestSchema } from './get-personnalisation-reponses.request';

export const getPersonnalisationConsequencesRequestSchema = extendApi(
  getPersonnalisationReponsesRequestSchema.extend({
    referentiel: z.nativeEnum(ReferentielType).optional(),
  })
).openapi({
  description:
    'Paramètres de la requête pour obtenir les conséquences de personnalisation sur un référentiel pour une collectivité donnée',
});
export type GetPersonnalisationConsequencesRequestType = z.infer<
  typeof getPersonnalisationConsequencesRequestSchema
>;
