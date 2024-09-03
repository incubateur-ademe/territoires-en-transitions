import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { collectiviteTable } from './collectivite.models';

export const groupementTable = pgTable('groupement', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
});
export type GroupementType = InferSelectModel<typeof groupementTable>;
export type CreateGroupementType = InferInsertModel<typeof groupementTable>;

export const groupementCollectiviteTable = pgTable('groupement_collectivite', {
  groupement_id: integer('groupement_id').references(() => groupementTable.id, {
    onDelete: 'cascade',
  }),
  collectivite_id: integer('collectivite_id').references(
    () => collectiviteTable.id,
    {
      onDelete: 'cascade',
    },
  ),
});
export type GroupementCollectiviteType = InferSelectModel<
  typeof groupementCollectiviteTable
>;
export type CreateGroupementCollectiviteType = InferInsertModel<
  typeof groupementCollectiviteTable
>;
