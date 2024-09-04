
import {
  pgEnum,
} from 'drizzle-orm/pg-core';
import { CollectiviteType } from './collectivite.table';
import { CommuneType } from './commune.table';
import { EpciType } from './epci.table';


export enum CollectiviteTypeEnum {
  EPCI = 'EPCI',
  COMMUNE = 'commune',
}

export enum CollectiviteSousTypeEnum {
  SYNDICAT = 'syndicat',
}

export type CollectiviteAvecType = Omit<
  CollectiviteType &
    Partial<CommuneType> &
    Partial<EpciType> & {
      type: CollectiviteTypeEnum;
      soustype: CollectiviteSousTypeEnum | null;
      population_tags: CollectivitePopulationTypeEnum[];
      drom: boolean;
    },
  'collectivite_id'
>;

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

export interface IdentiteCollectivite {
  type: CollectiviteTypeEnum;
  soustype: CollectiviteSousTypeEnum | null;
  population_tags: CollectivitePopulationTypeEnum[];
  drom: boolean;
}





