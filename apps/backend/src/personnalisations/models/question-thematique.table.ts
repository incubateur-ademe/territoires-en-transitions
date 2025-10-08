import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';

export const questionThematiqueTable = pgTable('question_thematique', {
  id: varchar('id', { length: 30 }).primaryKey().notNull(),
  nom: text('nom'),
});

export const questionThematiqueSchema = createSelectSchema(
  questionThematiqueTable
);
export type QuestionThematique = z.infer<typeof questionThematiqueSchema>;

export const createQuestionThematiqueSchema = createInsertSchema(
  questionThematiqueTable
);
