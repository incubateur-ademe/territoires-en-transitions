import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  foreignKey,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const tableauDeBordModuleTable = pgTable(
  'tableau_de_bord_module',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    userId: uuid('user_id'),
    titre: varchar('titre').notNull(),
    defaultKey: varchar('default_key'),
    type: varchar('type').notNull(),
    options: jsonb('options').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      tableauDeBordModuleCollectiviteIdFkey: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'tableau_de_bord_module_collectivite_id_fkey',
      })
        .onUpdate('cascade')
        .onDelete('restrict'),
      tableauDeBordModuleUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [dcpTable.userId],
        name: 'tableau_de_bord_module_user_id_fkey',
      })
        .onUpdate('cascade')
        .onDelete('restrict'),
    };
  }
);

export const tableauDeBordModuleSchema = createSelectSchema(
  tableauDeBordModuleTable
);
export const createTableauDeBordModuleSchema = createInsertSchema(
  tableauDeBordModuleTable
);
export type TableauDeBordModuleType = InferSelectModel<
  typeof tableauDeBordModuleTable
>;
export type CreateTableauDeBordModuleType = InferInsertModel<
  typeof tableauDeBordModuleTable
>;
