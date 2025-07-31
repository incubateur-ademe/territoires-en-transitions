import { questionTable } from '@/backend/personnalisations/models/question.table';
import { actionRelationTable } from '@/backend/referentiels/models/action-relation.table';
import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const questionActionTable = pgTable(
  'question_action',
  {
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionRelationTable.id)
      .notNull(),
    questionId: integer('question_id')
      .references(() => questionTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.actionId, table.questionId] })]
);
