import { integer, varchar } from 'drizzle-orm/pg-core';
import { importsSchema } from '@/backend/collectivites/shared/models/imports-region.table';

export const departementTable = importsSchema.table('departement', {
  code: varchar('code', { length: 3 }),
  population: integer('population').notNull(),
  libelle: varchar('libelle', { length: 30 }),
  regionCode: varchar('region_code', { length: 2 }).notNull(),
});
