import { pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const questionThematiqueTable = pgTable('question_thematique', {
  id: varchar('id', { length: 30 }).primaryKey().notNull(),
  nom: text('nom'),
});
