import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { sousThematiqueTable } from '../../taxonomie/models/sous-thematique.table';
import { actionImpactTable } from './action-impact.table';
import { InferSelectModel } from 'drizzle-orm';

export const actionImpactSousThematiqueTable = pgTable(
  'action_impact_sous_thematique',
  {
    actionImpactId: integer('action_impact_id')
      .notNull()
      .references(() => actionImpactTable.id),
    sousThematiqueId: integer('sous_thematique_id')
      .notNull()
      .references(() => sousThematiqueTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.actionImpactId, table.sousThematiqueId],
      }),
    };
  }
);

export type ActionImpactSousThematiqueType = InferSelectModel<
  typeof actionImpactSousThematiqueTable
>;
