import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// TODO: create domain siren as varchar(9) check ( value ~ '^\d{9}$' );
// TODO: create domain codegeo as varchar(5);

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
