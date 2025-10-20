import { questionTable } from '@/backend/collectivites/personnalisations/models/question.table';
import { actionRelationTable } from '@/backend/referentiels/models/action-relation.table';
import { pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';

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

export const questionActionSchema = createInsertSchema(questionActionTable);
export type QuestionActionType = z.infer<typeof questionActionSchema>;

export const createQuestionActionSchema =
  createSelectSchema(questionActionTable);
export type CreateQuestionActionType = z.infer<
  typeof createQuestionActionSchema
>;
