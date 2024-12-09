import { actionRelationTable } from '@/backend/referentiels';
import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurActionTable = pgTable(
  'indicateur_action',
  {
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id,
      {
        onDelete: 'cascade',
      }
    ),
    actionId: varchar('action_id').references(() => actionRelationTable.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.indicateurId, table.actionId] }),
    };
  }
);
