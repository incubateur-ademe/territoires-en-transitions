import { version } from '@tet/backend/utils/column.utils';
import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { questionTable } from './question.table';

export const questionChoixTable = pgTable('question_choix', {
  id: varchar('id', { length: 30 }).primaryKey().notNull(),
  questionId: varchar('question_id', { length: 30 })
    .references(() => questionTable.id, { onDelete: 'cascade' })
    .notNull(),
  ordonnancement: integer('ordonnancement'),
  formulation: text('formulation'),
  version,
});
