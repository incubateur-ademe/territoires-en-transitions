import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { ReferentielType } from '../../shared/models/referentiel.enum';

export const getPersonnalisationReglesRequestSchema = extendApi(
  z.object({
    referentiel: z.nativeEnum(ReferentielType).optional(),
  })
).describe(
  'Paramètres de la requête pour obtenir les règles de personnalisation'
);
export type GetPersonnalisationReglesRequestType = z.infer<
  typeof getPersonnalisationReglesRequestSchema
>;
