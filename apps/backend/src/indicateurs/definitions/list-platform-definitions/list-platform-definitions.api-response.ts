import { tagSchema } from '@tet/domain/collectivites';
import { indicateurDefinitionSchema } from '@tet/domain/indicateurs';
import { z } from 'zod/mini';

const platformDefinitionSchema = z.pick(indicateurDefinitionSchema, {
  id: true,
  version: true,
  identifiantReferentiel: true,
  titre: true,
  titreCourt: true,
  titreLong: true,
  description: true,
  unite: true,
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

const platformDefinitionAggregateSchema = z.object({
  ...platformDefinitionSchema.shape,

  categories: z.array(tagSchema),
  thematiques: z.array(tagSchema),
  mesures: z.array(
    z.object({
      id: z.string(),
      nom: z.string(),
    })
  ),
});

export const listPlatformDefinitionsApiResponseSchema = z.array(
  platformDefinitionAggregateSchema
);

export type ListPlatformDefinitionsApiResponse = z.infer<
  typeof listPlatformDefinitionsApiResponseSchema
>;
