import { pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { planActionTypeCategorieTable } from './plan-action-type-categorie.table';

export const planActionTypeTable = pgTable(
  'plan_action_type',
  {
    id: serial('id').primaryKey(),
    categorie: text('categorie')
      .notNull()
      .references(() => planActionTypeCategorieTable.categorie),
    type: text('type').notNull(),
    detail: text('detail'),
  },
  (table) => [
    uniqueIndex('plan_action_type_categorie_type_key').on(
      table.categorie,
      table.type
    ),
  ]
);
