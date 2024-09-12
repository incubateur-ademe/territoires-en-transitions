import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { actionImpactTable } from '../../panier/models/action-impact.table';
import { ficheActionTable } from './fiche-action.table';

export const actionImpactFicheActionTable = pgTable(
  'action_impact_fiche_action',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    actionImpactId: integer('action_impact_id').references(
      () => actionImpactTable.id,
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.actionImpactId] }),
    };
  },
);
