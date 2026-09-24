import { date, integer, pgTable, text } from 'drizzle-orm/pg-core';

export const indicateurPeriodiciteTable = pgTable('indicateur_periodicite', {
  code: text('code').primaryKey(),
  uniteCalendaire: text('unite_calendaire', {
    enum: ['mois', 'semaine', 'jour'],
  }).notNull(),
  nombreUnites: integer('nombre_unites').notNull(),
  dateAncrage: date('date_ancrage', { mode: 'string' }).notNull(),
});
