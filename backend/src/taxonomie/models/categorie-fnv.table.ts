import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';

export const categorieFNVTable = pgTable('categorie_fnv', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
});
export type CategorieFNVType = InferSelectModel<typeof categorieFNVTable>;

export const categorieFNVSchema = createSelectSchema(categorieFNVTable);
