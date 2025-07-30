import { actionRelationTable } from '@/backend/referentiels/models/action-relation.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurActionTable = pgTable(
  'indicateur_action',
  {
    indicateurId: integer('indicateur_id')
      .references(() => indicateurDefinitionTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    actionId: varchar('action_id')
      .references(() => actionRelationTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.indicateurId, table.actionId] }),
    };
  }
);

export type IndicateurActionType = InferSelectModel<
  typeof indicateurActionTable
>;
export type CreateIndicateurActionType = InferInsertModel<
  typeof indicateurActionTable
>;
