import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

export const effetAttenduTable = pgTable('effet_attendu', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  notice: text('notice'),
});

export const effetAttenduSchema = createSelectSchema(effetAttenduTable);
export type EffetAttendu = z.infer<typeof effetAttenduSchema>;
