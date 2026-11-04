import { tagSchema } from '@tet/domain/collectivites';
import { indicateurPredefiniSchema } from '@tet/domain/indicateurs';
import { z } from 'zod/mini';

const indicateurPredefiniApiSchema = z.pick(indicateurPredefiniSchema, {
  id: true,
  version: true,
  identifiantReferentiel: true,
  titre: true,
  titreCourt: true,
  titreLong: true,
  description: true,
  unite: true,
  periodicite: true,
  precision: true,
  borneMin: true,
  borneMax: true,
  participationScore: true,
  sansValeurUtilisateur: true,
  valeurCalcule: true,
  exprCible: true,
  exprSeuil: true,
  libelleCibleSeuil: true,
});

const indicateurPredefiniAggregateApiSchema = z.object({
  ...indicateurPredefiniApiSchema.shape,

  categories: z.array(tagSchema),
  thematiques: z.array(tagSchema),
  mesures: z.array(
    z.object({
      id: z.string(),
      nom: z.string(),
    })
  ),
});

export const listIndicateursPredefinisApiResponseSchema = z.array(
  indicateurPredefiniAggregateApiSchema
);

export type ListIndicateursPredefinisApiResponse = z.infer<
  typeof listIndicateursPredefinisApiResponseSchema
>;
