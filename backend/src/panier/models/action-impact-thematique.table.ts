import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { thematiqueTable } from '../../taxonomie/models/thematique.table';
import { actionImpactTable } from './action-impact.table';
import { InferSelectModel } from 'drizzle-orm';
import { actionImpactIndicateurTable } from './action-impact-indicateur.table';

export const actionImpactThematiqueTable = pgTable(
  'action_impact_thematique',
  {
    actionImpactId: integer('action_impact_id')
      .notNull()
      .references(() => actionImpactTable.id),
    thematiqueId: integer('thematique_id')
      .notNull()
      .references(() => thematiqueTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.actionImpactId, table.thematiqueId],
      }),
    };
  },
);

export type ActionImpactThematiqueType = InferSelectModel<
  typeof actionImpactThematiqueTable
>;
