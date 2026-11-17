import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';

export const indicateurGroupeTable = pgTable(
  'indicateur_groupe',
  {
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
  },
  (table) => [
    primaryKey({ columns: [table.parent, table.enfant] }),
    unique('indicateur_groupe_enfant_unique').on(table.enfant),
    check(
      'indicateur_groupe_parent_distinct_enfant',
      sql`${table.parent} <> ${table.enfant}`
    ),
  ]
);

export type IndicateurGroupe = InferSelectModel<typeof indicateurGroupeTable>;
export type CreateIndicateurGroupe = InferInsertModel<
  typeof indicateurGroupeTable
>;
