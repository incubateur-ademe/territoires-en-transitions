import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import { InferSelectModel } from 'drizzle-orm';
import { date, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
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

export const ficheActionNoteSchema = createSelectSchema(ficheActionNoteTable);

export const upsertFicheActionNoteSchema = createInsertSchema(
  ficheActionNoteTable
).pick({ id: true, dateNote: true, note: true });

export const deleteFicheActionNoteSchema = z.object({ id: z.number() });

export type FicheActionNote = InferSelectModel<typeof ficheActionNoteTable>;
export type UpsertFicheActionNote = z.infer<typeof upsertFicheActionNoteSchema>;
export type DeleteFicheActionNote = z.infer<typeof deleteFicheActionNoteSchema>;
