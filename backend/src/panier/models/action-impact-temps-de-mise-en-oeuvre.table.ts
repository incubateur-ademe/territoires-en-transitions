import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const actionImpactTempsDeMiseEnOeuvreTable = pgTable(
  'action_impact_temps_de_mise_en_oeuvre',
  {
    niveau: serial('niveau').primaryKey(),
    nom: text('nom').notNull(),
  }
);
