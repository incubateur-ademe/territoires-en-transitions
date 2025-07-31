import { InferSelectModel } from 'drizzle-orm';
import { date, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurObjectifTable = pgTable('indicateur_objectif', {
  indicateurId: integer('indicateur_id')
    .references(() => indicateurDefinitionTable.id)
    .notNull(),
  dateValeur: date('date_valeur').notNull(),
  formule: text('formule').notNull(),
});

export const indicateurObjectifSchema = createSelectSchema(
  indicateurObjectifTable
);
export type IndicateurObjectif = InferSelectModel<
  typeof indicateurObjectifTable
>;
