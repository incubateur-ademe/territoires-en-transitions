import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const analysisRunTable = pgTable('analysis_run', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  startedAt: timestamp('started_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(SQL_CURRENT_TIMESTAMP),
});
