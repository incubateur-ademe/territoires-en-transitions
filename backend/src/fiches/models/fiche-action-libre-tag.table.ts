import { libreTagTable } from '../../taxonomie/models/libre-tag.table';
import {
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';
import { sql } from 'drizzle-orm';

export const ficheActionLibreTagTable = pgTable(
  'fiche_action_libre_tag',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    libreTagId: integer('libre_tag_id').references(() => libreTagTable.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid('created_by').default(sql`auth.uid()`),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.libreTagId] }),
    };
  }
);
