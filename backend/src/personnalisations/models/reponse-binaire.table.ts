import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';

export const reponseBinaireTable = pgTable('reponse_binaire', {
  modified_at: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  collectivite_id: integer('collectivite_id')
    .references(() => collectiviteTable.id)
    .notNull(),
  // TODO: failed to parse database type 'question_id'
  question_id: varchar('question_id', { length: 30 }).notNull(),
  reponse: boolean('reponse'),
});
