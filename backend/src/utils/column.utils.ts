/**
 * Définitions usuelles de colonnes
 */
import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const TIMESTAMP_OPTIONS = {
  withTimezone: true,
  mode: 'string',
} as const;

const SQL_CURRENT_TIMESTAMP = sql`CURRENT_TIMESTAMP`;

export const createdAt = timestamp('created_at', TIMESTAMP_OPTIONS)
  .default(SQL_CURRENT_TIMESTAMP)
  .notNull();

export const modifiedAt = timestamp('modified_at', TIMESTAMP_OPTIONS)
  .default(SQL_CURRENT_TIMESTAMP)
  .notNull();

const SQL_AUTH_UID = sql`auth.uid()`;

// TODO references auth.uid
export const createdBy = uuid('created_by').default(SQL_AUTH_UID);

export const modifiedBy = uuid('modified_by').default(SQL_AUTH_UID);
