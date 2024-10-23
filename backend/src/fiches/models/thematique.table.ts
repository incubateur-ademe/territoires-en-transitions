import { InferInsertModel } from 'drizzle-orm';
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

export const thematiqueTable = pgTable('thematique', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  md_id: varchar('md_id'),
});
export type CreateThematiqueType = InferInsertModel<typeof thematiqueTable>;

export const thematiqueSchema = createSelectSchema(thematiqueTable);
