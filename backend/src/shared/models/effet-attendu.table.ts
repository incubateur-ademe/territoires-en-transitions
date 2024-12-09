import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

export const effetAttenduTable = pgTable('effet_attendu', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  notice: text('notice'),
});

export const effetAttenduSchema = createSelectSchema(effetAttenduTable);
