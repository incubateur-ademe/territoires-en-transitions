import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from '../../definitions/indicateur-definition.table';

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
  (table) => [primaryKey({ columns: [table.parent, table.enfant] })]
);

export type IndicateurGroupe = InferSelectModel<typeof indicateurGroupeTable>;
export type CreateIndicateurGroupe = InferInsertModel<
  typeof indicateurGroupeTable
>;
