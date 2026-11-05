import { TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const fichierScanStatusValues = ['clean', 'infected', 'error'] as const;
export type FichierScanStatus = (typeof fichierScanStatusValues)[number];

export const fichierScanTable = pgTable(
  'collectivite_fichier_scan',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    bucketId: text('bucket_id').notNull(),
    objectName: text('object_name').notNull(),
    status: text('status', { enum: fichierScanStatusValues }).notNull(),
    signature: text('signature'),
    engineVersion: text('engine_version'),
    attempts: integer('attempts').notNull().default(1),
    scannedAt: timestamp('scanned_at', TIMESTAMP_OPTIONS)
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', TIMESTAMP_OPTIONS),
  },
  (table) => [
    unique('collectivite_fichier_scan_unique_objet').on(
      table.bucketId,
      table.objectName
    ),
  ]
);
