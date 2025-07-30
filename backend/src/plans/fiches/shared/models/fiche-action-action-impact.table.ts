import { actionImpactTable } from '@/backend/plans/paniers/models/action-impact.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionActionImpactTable = pgTable(
  'action_impact_fiche_action',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    actionImpactId: integer('action_impact_id').references(
      () => actionImpactTable.id
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.actionImpactId] }),
    };
  }
);
