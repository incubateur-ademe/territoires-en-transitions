import { collectiviteTable } from '@/backend/collectivites';
import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const reponseBinaireTable = pgTable('reponse_binaire', {
  modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  collectiviteId: integer('collectivite_id')
    .references(() => collectiviteTable.id)
    .notNull(),
  // TODO: failed to parse database type 'question_id'
  questionId: varchar('question_id', { length: 30 }).notNull(),
  reponse: boolean('reponse'),
});
