import { collectiviteBanaticTypeTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import { collectiviteNature } from '@tet/domain/collectivites';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';

export const collectiviteTable = pgTable('collectivite', {
  id: serial('id').primaryKey(),
  modifiedAt,
  createdAt,
  accesRestreint: boolean('access_restreint'),
  nom: text('nom').notNull(),
  type: text('type').notNull(), // TODO check collectiviteType
  communeCode: varchar('commune_code', { length: 5 }),
  siren: varchar('siren', { length: 9 }),
  nic: varchar('nic', { length: 5 }),
  departementCode: varchar('departement_code', { length: 3 }),
  regionCode: varchar('region_code', { length: 2 }),
  natureInsee: text('nature_insee', {
    enum: collectiviteNature,
  }).references(() => collectiviteBanaticTypeTable.id),
  population: integer('population'),
  dansAireUrbaine: boolean('dans_aire_urbaine'),
});
