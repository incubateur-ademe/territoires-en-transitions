import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const tempsDeMiseEnOeuvreTable = pgTable(
  'action_impact_temps_de_mise_en_oeuvre',
  {
    id: serial('niveau').primaryKey(),
    nom: text('nom').notNull(),
  }
);
