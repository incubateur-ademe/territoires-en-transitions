import { InferSelectModel } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const categorieFNVTable = pgTable('categorie_fnv', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
});
export type CategorieFNVType = InferSelectModel<typeof categorieFNVTable>;
