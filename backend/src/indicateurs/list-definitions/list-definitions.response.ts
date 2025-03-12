import z from 'zod';
import { indicateurCollectiviteSchema } from '../shared/models/indicateur-collectivite.table';
import { indicateurDefinitionSchema } from '../shared/models/indicateur-definition.table';

export const indicateurDefinitionDetailleeSchema = indicateurDefinitionSchema
  .merge(
    indicateurCollectiviteSchema.pick({
      commentaire: true,
      confidentiel: true,
      favoris: true,
    })
  )
  .omit({ identifiantReferentiel: true })
  .extend({
    identifiant: indicateurDefinitionSchema.shape.identifiantReferentiel,
    categories: z.string().array(),
    thematiques: z.string().array(),
    enfants: indicateurDefinitionSchema
      .pick({
        id: true,
        identifiantReferentiel: true,
        titre: true,
        titreCourt: true,
      })
      .array()
      .nullable(),
    actions: z.string().array(),
    hasOpenData: z.boolean(),
    estPerso: z.boolean(),
    estAgregation: z.boolean(),
  });

export type IndicateurDefinitionDetaillee = z.infer<
  typeof indicateurDefinitionDetailleeSchema
>;
