import { integer, pgTable } from 'drizzle-orm/pg-core';
import { collectiviteTable } from './collectivite.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { groupementTable } from './groupement.table';

export const groupementCollectiviteTable = pgTable('groupement_collectivite', {
  groupementId: integer('groupement_id').references(() => groupementTable.id, {
    onDelete: 'cascade',
  }),
  collectiviteId: integer('collectivite_id').references(
    () => collectiviteTable.id,
    {
      onDelete: 'cascade',
    }
  ),
});
export type GroupementCollectiviteType = InferSelectModel<
  typeof groupementCollectiviteTable
>;
export type CreateGroupementCollectiviteType = InferInsertModel<
  typeof groupementCollectiviteTable
>;
