import { integer, pgEnum, varchar } from 'drizzle-orm/pg-core';
import { importsSchema } from "./imports-region.table";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

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

export const banaticTable = importsSchema.table('banatic', {
    siren: varchar('siren', { length: 9 }).primaryKey(),
    libelle: varchar('libelle', { length: 250 }),
    regionCode: varchar('region_code', { length: 2 }),
    departementCode: varchar('departement_code', { length: 3 }),
    nature: epciNatureEnum('nature').notNull(),
    population: integer('population').notNull(),
  });

  export type BanaticType = InferSelectModel<typeof banaticTable>;
  export type CreateBanaticType = InferInsertModel<typeof banaticTable>;
