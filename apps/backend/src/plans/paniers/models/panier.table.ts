import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { SQL, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const panierTable = pgTable('panier', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  createdBy: uuid('created_by'), // TODO references auth.users
  collectiviteId: integer('collectivite_id').references(
    () => collectiviteTable.id
  ),
  collectivitePreset: integer('collectivite_preset')
    .unique()
    .references(() => collectiviteTable.id),
  latestUpdate: timestamp('latest_update', {
    withTimezone: true,
    mode: 'string',
  })
    .notNull()
    .defaultNow(),
  private: boolean('private').generatedAlwaysAs(
    (): SQL => sql`(${panierTable.collectiviteId} is not null)`
  ),
});
