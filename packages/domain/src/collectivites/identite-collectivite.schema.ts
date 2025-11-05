import { z } from 'zod';
import { collectiviteSchema } from './collectivite.schema';

export enum CollectiviteTypeEnum {
  EPCI = 'EPCI',
  COMMUNE = 'commune',
}

export enum CollectiviteSousTypeEnum {
  SYNDICAT = 'syndicat',
}

export enum CollectivitePopulationTypeEnum {
  MOINS_DE_3000 = 'moins_de_3000',
  MOINS_DE_5000 = 'moins_de_5000',
  MOINS_DE_10000 = 'moins_de_10000',
  MOINS_DE_20000 = 'moins_de_20000',
  MOINS_DE_50000 = 'moins_de_50000',
  MOINS_DE_100000 = 'moins_de_100000',
  PLUS_DE_3000 = 'plus_de_3000',
  PLUS_DE_20000 = 'plus_de_20000',
  PLUS_DE_50000 = 'plus_de_50000',
  PLUS_DE_100000 = 'plus_de_100000',
  PLUS_DE_300000 = 'plus_de_300000',
  PLUS_DE_800000 = 'plus_de_800000',
}

export enum CollectiviteLocalisationTypeEnum {
  DOM = 'DOM',
  METROPOLE = 'Metropole',
}

export const identiteCollectiviteSchema = z.object({
  type: z.enum(CollectiviteTypeEnum),
  soustype: z.enum(CollectiviteSousTypeEnum).nullable(),
  populationTags: z.array(z.enum(CollectivitePopulationTypeEnum)),
  drom: z.boolean().nullable(),
  test: z.boolean().optional(),
  dansAireUrbaine: z.boolean().nullable().optional(),
});

export type IdentiteCollectivite = z.infer<typeof identiteCollectiviteSchema>;

export const collectiviteAvecTypeSchema = collectiviteSchema.merge(
  identiteCollectiviteSchema
);

export type CollectiviteAvecType = z.infer<typeof collectiviteAvecTypeSchema>;
