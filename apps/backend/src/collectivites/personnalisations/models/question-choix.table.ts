import { version } from '@/backend/utils/column.utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
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

export type QuestionChoixType = InferSelectModel<typeof questionChoixTable>;
export type CreateQuestionChoixType = InferInsertModel<
  typeof questionChoixTable
>;
export const questionChoixSchema = createSelectSchema(questionChoixTable);
export const createQuestionChoixSchema = createInsertSchema(questionChoixTable);
