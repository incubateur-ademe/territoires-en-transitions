import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  foreignKey,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { labellisationAuditTable } from './labellisation-audit.table';
import { referentielEnum } from './referentiel.enum';

export const postAuditScoresTable = pgTable(
  'post_audit_scores',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    referentiel: referentielEnum('referentiel').notNull(),
    scores: jsonb('scores').notNull(),
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
    }).notNull(),
    payloadTimestamp: timestamp('payload_timestamp', {
      withTimezone: true,
    }),
    auditId: integer('audit_id').notNull(),
  },
  (table) => {
    return {
      postAuditScoresAuditIdFkey: foreignKey({
        columns: [table.auditId],
        foreignColumns: [labellisationAuditTable.id],
        name: 'post_audit_scores_audit_id_fkey',
      }).onDelete('cascade'),
      postAuditScoresPkey: primaryKey({
        columns: [table.collectiviteId, table.referentiel, table.auditId],
        name: 'post_audit_scores_pkey',
      }),
    };
  }
);

export type PostAuditScoresType = InferSelectModel<typeof postAuditScoresTable>;
export type CreatePostAuditScoresType = InferInsertModel<
  typeof postAuditScoresTable
>;

export const postAuditScoresSchema = createSelectSchema(postAuditScoresTable);
export const createPostAuditScoresTable =
  createInsertSchema(postAuditScoresTable);
