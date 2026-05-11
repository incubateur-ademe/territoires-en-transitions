import { integer, varchar } from 'drizzle-orm/pg-core';
import { importsSchema, regionTable } from './imports-region.table';

export const departementTable = importsSchema.table('departement', {
  code: varchar('code', { length: 3 }).notNull(),
  population: integer('population').notNull(),
  libelle: varchar('libelle', { length: 30 }).notNull(),
  regionCode: varchar('region_code', { length: 2 })
    .notNull()
    .references(() => regionTable.code),
});
