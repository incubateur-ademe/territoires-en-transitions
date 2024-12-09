import { collectiviteTable } from '@/backend/collectivites';
import { sql } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const reponseProportionTable = pgTable('reponse_proportion', {
  modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  collectiviteId: integer('collectivite_id')
    .references(() => collectiviteTable.id)
    .notNull(),
  // TODO: Reference question
  questionId: varchar('question_id', { length: 30 }).notNull(),
  reponse: doublePrecision('reponse'),
});
