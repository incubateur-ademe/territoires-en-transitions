import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';
import { relationAuditColumns } from './relation-audit.column';

export const ficheActionThematiqueTable = pgTable(
  'fiche_action_thematique',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    thematiqueId: integer('thematique_id').references(() => thematiqueTable.id),
    ...relationAuditColumns,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.thematiqueId] }),
    };
  }
);
