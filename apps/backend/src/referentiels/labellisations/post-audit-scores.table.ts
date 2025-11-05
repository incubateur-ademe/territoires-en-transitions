import {
  foreignKey,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
} from 'drizzle-orm/pg-core';
import { referentielIdPgEnum } from '../referentiel-id.column';
import { auditTable } from './audit.table';

export const postAuditScoresTable = pgTable(
  'post_audit_scores',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    referentiel: referentielIdPgEnum('referentiel').notNull(),
    scores: jsonb('scores').notNull(),
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
    }).notNull(),
    payloadTimestamp: timestamp('payload_timestamp', {
      withTimezone: true,
    }),
    auditId: integer('audit_id').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.auditId],
      foreignColumns: [auditTable.id],
      name: 'post_audit_scores_audit_id_fkey',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.collectiviteId, table.referentiel, table.auditId],
      name: 'post_audit_scores_pkey',
    }),
  ]
);
