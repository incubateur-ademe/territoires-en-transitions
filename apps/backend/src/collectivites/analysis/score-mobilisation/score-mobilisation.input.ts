import {
  categorieActionEnumValues,
  enjeuEnumValues,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { z } from 'zod';
import { ficheTextSchema } from '../models/fiche-analysis';

export const calculateCollectiviteMobilisationInputSchema = z.object({
  enjeu: z.enum(enjeuEnumValues),
  collectiviteId: z.number().int().positive(),
  volets: z.array(
    z.object({
      ficheId: z.number().int().positive(),
      levierId: z.enum(levierIdEnumValues),
      categorie: z.enum(categorieActionEnumValues),
    })
  ),
  fiches: z.array(ficheTextSchema),
});

export type CalculateCollectiviteMobilisationInput = z.output<
  typeof calculateCollectiviteMobilisationInputSchema
>;
