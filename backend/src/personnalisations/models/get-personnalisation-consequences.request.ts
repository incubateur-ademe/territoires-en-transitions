import { z } from 'zod';
import { referentielIdEnumSchema } from '../../referentiels/models/referentiel-id.enum';
import { getPersonnalisationReponsesRequestSchema } from './get-personnalisation-reponses.request';

export const getPersonnalisationConsequencesRequestSchema =
  getPersonnalisationReponsesRequestSchema
    .extend({
      referentiel: referentielIdEnumSchema.optional(),
    })
    .describe(
      'Paramètres de la requête pour obtenir les conséquences de personnalisation sur un référentiel pour une collectivité donnée'
    );
export type GetPersonnalisationConsequencesRequestType = z.infer<
  typeof getPersonnalisationConsequencesRequestSchema
>;
