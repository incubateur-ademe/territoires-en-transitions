import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  createdAt,
  createdBy,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import type {
  DemarchePcaetDiagnosticJalon,
  DemarchePcaetDiagnosticPayload,
} from '@tet/domain/demarches';
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

/**
 * Diagnostic figé à un jalon du dépôt : c'est cette photo que consultent les
 * instances consultatives. Les valeurs de la collectivité continuent d'évoluer
 * côté indicateurs sans affecter ce qui a été transmis.
 */
export const demarchePcaetDiagnosticSnapshotTable = pgTable(
  'demarche_pcaet_diagnostic_snapshot',
  {
    id: serial('id').primaryKey().notNull(),
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    jalon: text('jalon').notNull().$type<DemarchePcaetDiagnosticJalon>(),
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
    payload: jsonb('payload').notNull().$type<DemarchePcaetDiagnosticPayload>(),
    createdAt,
    createdBy,
  },
  (table) => [unique().on(table.demarcheId, table.jalon, table.date)]
);
