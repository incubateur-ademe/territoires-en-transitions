import { date, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from '../../definitions/indicateur-definition.table';

export const indicateurObjectifTable = pgTable('indicateur_objectif', {
  indicateurId: integer('indicateur_id')
    .references(() => indicateurDefinitionTable.id)
    .notNull(),
  dateValeur: date('date_valeur').notNull(),
  formule: text('formule').notNull(),
});
