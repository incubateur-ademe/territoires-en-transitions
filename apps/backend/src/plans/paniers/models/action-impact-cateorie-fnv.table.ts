import { categorieFNVTable } from '@/backend/shared/models/categorie-fnv.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { actionImpactTable } from './action-impact.table';

export const actionImpactCategorieFNVTable = pgTable(
  'action_impact_categorie_fnv',
  {
    actionImpactId: integer('action_impact_id')
      .notNull()
      .references(() => actionImpactTable.id),
    categorieFnvId: integer('categorie_fnv_id')
      .notNull()
      .references(() => categorieFNVTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.actionImpactId, table.categorieFnvId],
      }),
    };
  }
);
