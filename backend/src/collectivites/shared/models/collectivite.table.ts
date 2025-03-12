import { collectiviteBanaticTypeTable } from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { createdAt, modifiedAt } from '../../../utils/column.utils';

export const collectiviteTypeEnum = {
  Region: 'region',
  Departement: 'departement',
  EPCI: 'epci',
  Commune: 'commune',
  Test: 'test',
};

export const collectiviteTable = pgTable('collectivite', {
  id: serial('id').primaryKey(),
  modifiedAt,
  createdAt,
  accessRestreint: boolean('access_restreint'),
  nom: text('nom'),
  type: text('type').notNull(), // TODO check collectiviteType
  communeCode: varchar('commune_code', { length: 5 }),
  siren: varchar('siren', { length: 9 }),
  departementCode: varchar('departement_code', { length: 3 }),
  regionCode: varchar('region_code', { length: 2 }),
  natureInsee: text('nature_insee').references(
    () => collectiviteBanaticTypeTable.id
  ),
  population: integer('population'),
});
export const collectiviteSchema = createSelectSchema(collectiviteTable);
export const collectiviteResumeSchema = collectiviteSchema.pick({
  id: true,
  nom: true,
  siren: true,
  natureInsee: true,
});
export const collectiviteUpsertSchema = createInsertSchema(collectiviteTable);
export type Collectivite = InferSelectModel<typeof collectiviteTable>;
export type CollectiviteResume = z.infer<typeof collectiviteResumeSchema>;
export type CollectiviteUpsert = z.infer<typeof collectiviteUpsertSchema>;
