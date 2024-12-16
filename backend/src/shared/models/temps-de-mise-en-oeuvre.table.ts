import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

export const tempsDeMiseEnOeuvreTable = pgTable(
  'action_impact_temps_de_mise_en_oeuvre',
  {
    id: serial('niveau').primaryKey(),
    nom: text('nom').notNull(),
  }
);

export const tempsDeMiseEnOeuvreSchema = createSelectSchema(
  tempsDeMiseEnOeuvreTable
);

export type TempsDeMiseEnOeuvre = z.infer<typeof tempsDeMiseEnOeuvreSchema>;
