import { z } from 'zod';
import {
  indicateurDefinitionParentDtoSchema,
  indicateurListItemSchema,
  listIndicateursOutputSchema,
} from './list-indicateurs.output';

const indicateurApiListItemSchema = indicateurListItemSchema
  .omit({ estFavori: true, estConfidentiel: true, fiches: true, parent: true })
  .extend({
    favoris: indicateurListItemSchema.shape.estFavori,
    confidentiel: indicateurListItemSchema.shape.estConfidentiel,
    ficheActions: indicateurListItemSchema.shape.fiches,
    parents: z.array(indicateurDefinitionParentDtoSchema),
  });

export const listIndicateursApiResponseSchema =
  listIndicateursOutputSchema.extend({
    data: z.array(indicateurApiListItemSchema),
  });

export type ListIndicateursApiResponse = z.infer<
  typeof listIndicateursApiResponseSchema
>;
