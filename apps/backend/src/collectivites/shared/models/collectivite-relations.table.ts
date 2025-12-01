import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { collectiviteTable } from './collectivite.table';

export const collectiviteRelationsTable = pgTable(
  'collectivite_relations',
  {
    id: integer('id')
      .notNull()
      .references(() => collectiviteTable.id, {
        onDelete: 'cascade',
      }),
    parentId: integer('parent_id')
      .notNull()
      .references(() => collectiviteTable.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => [primaryKey({ columns: [table.id, table.parentId] })]
);
