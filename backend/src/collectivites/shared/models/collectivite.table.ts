import { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { createdAt, modifiedAt } from '../../../utils/column.utils';
import { collectiviteTypeTable } from '@/backend/collectivites/shared/models/collectivite-type.table';
import { collectiviteBanaticTypeTable } from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { z } from 'zod';

export const collectiviteTable = pgTable('collectivite', {
  id: serial('id').primaryKey(),
  modifiedAt,
  createdAt,
  accessRestreint: boolean('access_restreint'),
  nom: text('nom'),
  typeId: text('type_id').references(() => collectiviteTypeTable.id),
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
export type Collectivite = InferSelectModel<typeof collectiviteTable>;
export type CollectiviteResume = z.infer<typeof collectiviteResumeSchema>;
