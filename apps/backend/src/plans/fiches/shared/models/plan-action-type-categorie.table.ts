import { pgTable, text } from 'drizzle-orm/pg-core';

export const planActionTypeCategorieTable = pgTable(
  'plan_action_type_categorie',
  {
    categorie: text('categorie').primaryKey(),
  }
);
