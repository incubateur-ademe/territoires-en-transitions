import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const effetAttenduTable = pgTable('effet_attendu', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  notice: text('notice'),
});
