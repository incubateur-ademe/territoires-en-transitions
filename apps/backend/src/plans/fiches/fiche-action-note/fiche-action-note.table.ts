import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import { date, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { ficheActionTable } from '../shared/models/fiche-action.table';
export const ficheActionNoteTable = pgTable('fiche_action_note', {
  id: serial('id').primaryKey(),
  ficheId: integer('fiche_id')
    .notNull()
    .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
  dateNote: date('date_note').notNull(),
  note: text('note').notNull(),
  createdAt,
  modifiedAt,
  createdBy,
  modifiedBy,
});
