import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  createdAt,
  createdBy,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import { demarchePcaetDiagnosticJalonValues } from '@tet/domain/demarches';
import type { DemarchePcaetDiagnosticPayload } from '@tet/domain/demarches';
import { sql } from 'drizzle-orm';
import {
  check,
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
    jalon: text('jalon', {
      enum: demarchePcaetDiagnosticJalonValues,
    }).notNull(),
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull().defaultNow(),
    payload: jsonb('payload').notNull().$type<DemarchePcaetDiagnosticPayload>(),
    createdAt,
    createdBy,
  },
  (table) => [
    unique().on(table.demarcheId, table.jalon, table.date),
    // Nom donné par PostgreSQL au CHECK inline du DDL sqitch : le reprendre
    // tel quel évite un faux écart de schéma.
    check(
      'demarche_pcaet_diagnostic_snapshot_jalon_check',
      sql`${table.jalon} IN (${sql.join(
        demarchePcaetDiagnosticJalonValues.map((jalon) => sql`${jalon}`),
        sql`, `
      )})`
    ),
  ]
);
