import * as z from 'zod/mini';

export const indicateurCollectiviteSchema = z.object({
  collectiviteId: z.number(),
  indicateurId: z.number(),
  commentaire: z.nullable(z.string()),
  confidentiel: z.boolean(),
  favoris: z.boolean(),
  /**
   * Choix explicite de la collectivité : un indicateur non applicable ne lui
   * est plus réclamé. `true` par défaut, y compris sans ligne en base.
   */
  isApplicable: z.boolean(),
  modifiedBy: z.nullable(z.uuid()),
  modifiedAt: z.string(),
});

export type IndicateurCollectivite = z.infer<
  typeof indicateurCollectiviteSchema
>;
