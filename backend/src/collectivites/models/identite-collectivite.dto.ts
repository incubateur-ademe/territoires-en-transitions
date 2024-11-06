
import {
  pgEnum,
} from 'drizzle-orm/pg-core';
import { collectiviteSchema, CollectiviteType } from './collectivite.table';
import { communeSchema, CommuneType } from './commune.table';
import { epciSchema, EpciType } from './epci.table';
import { z } from 'zod';


export enum CollectiviteTypeEnum {
  EPCI = 'EPCI',
  COMMUNE = 'commune',
}

export enum CollectiviteSousTypeEnum {
  SYNDICAT = 'syndicat',
}

export enum CollectivitePopulationTypeEnum {
  MOINS_DE_5000 = 'moins_de_5000',
  MOINS_DE_10000 = 'moins_de_10000',
  MOINS_DE_20000 = 'moins_de_20000',
  MOINS_DE_50000 = 'moins_de_50000',
  MOINS_DE_100000 = 'moins_de_100000',
  PLUS_DE_20000 = 'plus_de_20000',
  PLUS_DE_100000 = 'plus_de_100000',
}
export const typePopulationEnum = pgEnum('type_population', [
  CollectivitePopulationTypeEnum.MOINS_DE_5000,
  CollectivitePopulationTypeEnum.MOINS_DE_10000,
  CollectivitePopulationTypeEnum.MOINS_DE_20000,
  CollectivitePopulationTypeEnum.MOINS_DE_50000,
  CollectivitePopulationTypeEnum.MOINS_DE_100000,
  CollectivitePopulationTypeEnum.PLUS_DE_20000,
  CollectivitePopulationTypeEnum.PLUS_DE_100000,
]);

export enum CollectiviteLocalisationTypeEnum {
  DOM = 'DOM',
  METROPOLE = 'Metropole',
}
export const typeLocalisationEnum = pgEnum('type_localisation', [
  CollectiviteLocalisationTypeEnum.DOM,
  CollectiviteLocalisationTypeEnum.METROPOLE,
]);

export const identiteCollectiviteSchema = z.object({
  type: z.nativeEnum(CollectiviteTypeEnum),
  soustype: z.nativeEnum(CollectiviteSousTypeEnum).nullable(),
  population_tags: z.array(z.nativeEnum(CollectivitePopulationTypeEnum)),
  drom: z.boolean(),
});

export type IdentiteCollectivite = z.infer<typeof identiteCollectiviteSchema>;


export const collectiviteAvecTypeSchema = collectiviteSchema
.merge(communeSchema.partial())
.merge(epciSchema.partial())
.merge(identiteCollectiviteSchema)
.omit({
  collectiviteId: true,
});

export type CollectiviteAvecType = z.infer<typeof collectiviteAvecTypeSchema>;









