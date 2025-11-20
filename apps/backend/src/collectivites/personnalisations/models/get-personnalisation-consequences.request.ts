import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';
import { getPersonnalisationReponsesRequestSchema } from './get-personnalisation-reponses.request';

export const getPersonnalisationConsequencesRequestSchema =
  getPersonnalisationReponsesRequestSchema
    .extend({
      referentiel: z.optional(referentielIdEnumSchema),
    })
    .describe(
      'Paramètres de la requête pour obtenir les conséquences de personnalisation sur un référentiel pour une collectivité donnée'
    );
export type GetPersonnalisationConsequencesRequestType = z.infer<
  typeof getPersonnalisationConsequencesRequestSchema
>;
