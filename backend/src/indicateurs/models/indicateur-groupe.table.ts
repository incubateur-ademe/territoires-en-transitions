import { integer, pgTable } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';
import { primaryKey } from 'drizzle-orm/pg-core';

export const indicateurGroupeTable = pgTable(
  'indicateur_groupe',
  {
    parent: integer('parent').references(() => indicateurDefinitionTable.id, {
      onDelete: 'cascade',
    }).notNull(),
    enfant: integer('enfant').references(() => indicateurDefinitionTable.id, {
      onDelete: 'cascade',
    }).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.parent, table.enfant] }),
    };
  }
);
