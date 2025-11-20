import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const questionActionTable = pgTable(
  'question_action',
  {
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionRelationTable.id)
      .notNull(),
    questionId: varchar('question_id', { length: 30 })
      .references(() => questionTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.actionId, table.questionId] })]
);
