import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// TODO: create domain siren as varchar(9) check ( value ~ '^\d{9}$' );
// TODO: create domain codegeo as varchar(5);

export enum CollectiviteTypeEnum {
  EPCI = 'EPCI',
  COMMUNE = 'commune',
}

export enum CollectiviteSousTypeEnum {
  SYNDICAT = 'syndicat',
}

export const epciNatureEnum = pgEnum('nature', [
  'SMF',
  'CU',
  'CC',
  'SIVOM',
  'POLEM',
  'METRO',
  'SMO',
  'CA',
  'EPT',
  'SIVU',
  'PETR',
]);

export const collectiviteTable = pgTable('collectivite', {
  id: serial('id').primaryKey(),
  modified_at: timestamp('modified_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(),
  access_restreint: boolean('access_restreint'),
});
export const collectiviteSchema = createSelectSchema(collectiviteTable);
export const createCollectiviteSchema = createInsertSchema(collectiviteTable);
export type CollectiviteType = InferSelectModel<typeof collectiviteTable>;
export type CreateCollectiviteType = InferInsertModel<typeof collectiviteTable>;

export const epciTable = pgTable('epci', {
  id: serial('id').primaryKey(),
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  nom: varchar('nom', { length: 300 }).notNull(),
  siren: varchar('siren', { length: 9 }).unique().notNull(),
  nature: epciNatureEnum('nature').notNull(),
});
export const epciSchema = createSelectSchema(epciTable);
export const createEpciSchema = createInsertSchema(epciTable);
export type EpciType = InferSelectModel<typeof epciTable>;
export type CreateEpciType = InferInsertModel<typeof epciTable>;

export const communeTable = pgTable('commune', {
  id: serial('id').primaryKey(),
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  nom: varchar('nom', { length: 300 }).notNull(),
  code: varchar('code', { length: 5 }).unique().notNull(), // TODO: domain codegeo
});
export type CommuneType = InferSelectModel<typeof communeTable>;
export type CreateCommuneType = InferInsertModel<typeof communeTable>;

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

export const importsSchema = pgSchema('imports');

export const regionTable = importsSchema.table('region', {
  code: varchar('code', { length: 2 }),
  population: integer('population').notNull(),
  libelle: varchar('libelle', { length: 30 }),
  drom: boolean('drom').notNull(),
});
export type RegionType = InferSelectModel<typeof regionTable>;
export type CreateRegionType = InferInsertModel<typeof regionTable>;

export const banaticTable = importsSchema.table('banatic', {
  siren: varchar('siren', { length: 9 }).primaryKey(),
  libelle: varchar('libelle', { length: 250 }),
  region_code: varchar('region_code', { length: 2 }),
  departement_code: varchar('departement_code', { length: 3 }),
  nature: epciNatureEnum('nature').notNull(),
  population: integer('population').notNull(),
});

export type BanaticType = InferSelectModel<typeof banaticTable>;
export type CreateBanaticType = InferInsertModel<typeof banaticTable>;

export const importCommuneTable = importsSchema.table('commune', {
  code: varchar('code', { length: 5 }).primaryKey(),
  region_code: varchar('region_code', { length: 2 }),
  departement_code: varchar('departement_code', { length: 3 }),
  libelle: varchar('libelle', { length: 30 }),
  population: integer('population').notNull(),
});
