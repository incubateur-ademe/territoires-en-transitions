import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const groupementTable = pgTable('groupement', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
});
export type GroupementType = InferSelectModel<typeof groupementTable>;
export type CreateGroupementType = InferInsertModel<typeof groupementTable>;
