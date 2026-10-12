import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { ActionDeReferenceId } from '@tet/domain/shared';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { actionDeReferenceTable } from './action-de-reference.table';

export const actionDeReferenceFicheTable = pgTable(
  'action_de_reference_fiche',
  {
    actionDeReferenceId: integer('action_de_reference_id')
      .notNull()
      .$type<ActionDeReferenceId>()
      .references(() => actionDeReferenceTable.id, { onDelete: 'cascade' }),
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.actionDeReferenceId, table.ficheId] }),
  ]
);
