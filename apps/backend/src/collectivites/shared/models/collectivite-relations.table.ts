import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
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

export const collectiviteRelationsSchema = createSelectSchema(
  collectiviteRelationsTable
);
export const collectiviteRelationsInsertSchema = createInsertSchema(
  collectiviteRelationsTable
);

export type CollectiviteRelations = z.infer<typeof collectiviteRelationsSchema>;
export type CollectiviteRelationsInsert = z.infer<
  typeof collectiviteRelationsInsertSchema
>;
