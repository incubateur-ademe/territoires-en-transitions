import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  createdAt,
  modifiedAt,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import { InferSelectModel, sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const AuditPreuvesArchiveStatusEnum = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

const orderedAuditPreuvesArchiveStatus = [
  AuditPreuvesArchiveStatusEnum.PENDING,
  AuditPreuvesArchiveStatusEnum.PROCESSING,
  AuditPreuvesArchiveStatusEnum.COMPLETED,
  AuditPreuvesArchiveStatusEnum.FAILED,
] as const;

export const auditPreuvesArchiveStatusSchema = z.enum(
  orderedAuditPreuvesArchiveStatus
);

export type AuditPreuvesArchiveStatus = z.infer<
  typeof auditPreuvesArchiveStatusSchema
>;

export const auditPreuvesArchiveInFlightStatuses: readonly AuditPreuvesArchiveStatus[] =
  [AuditPreuvesArchiveStatusEnum.PENDING, AuditPreuvesArchiveStatusEnum.PROCESSING];

export const auditPreuvesArchiveDeletableStatuses: AuditPreuvesArchiveStatus[] = [
  AuditPreuvesArchiveStatusEnum.COMPLETED,
  AuditPreuvesArchiveStatusEnum.FAILED,
];

export const auditPreuvesArchiveTable = pgTable(
  'audit_preuves_archive',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    referentielId: text('referentiel_id').notNull(),
    auditId: integer('audit_id')
      .notNull()
      .references(() => auditTable.id, { onDelete: 'cascade' }),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => authUsersTable.id, { onDelete: 'cascade' }),
    status: text('status').notNull().$type<AuditPreuvesArchiveStatus>(),
    totalFiles: integer('total_files').notNull().default(0),
    processedFiles: integer('processed_files').notNull().default(0),
    storagePath: text('storage_path'),
    errorMessage: text('error_message'),
    createdAt,
    modifiedAt,
    expiresAt: timestamp('expires_at', TIMESTAMP_OPTIONS).notNull(),
  },
  (table) => [
    uniqueIndex('audit_preuves_archive_in_flight_unique')
      .on(table.auditId, table.requestedBy)
      .where(sql`status IN ('pending', 'processing')`),
  ]
);

export type AuditPreuvesArchive = InferSelectModel<
  typeof auditPreuvesArchiveTable
>;
