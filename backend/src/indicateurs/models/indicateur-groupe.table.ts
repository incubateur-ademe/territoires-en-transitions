import { integer, pgTable } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurGroupeTable = pgTable('indicateur_groupe', {
  parent: integer('parent')
    .references(() => indicateurDefinitionTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  enfant: integer('enfant')
    .references(() => indicateurDefinitionTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
});
