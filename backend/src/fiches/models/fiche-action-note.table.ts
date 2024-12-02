import { date, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { ficheActionTable } from './fiche-action.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '../../common/models/column.helpers';

export const ficheActionNoteTable = pgTable('fiche_action_note', {
  id: serial('id').primaryKey(),
  ficheId: integer('fiche_id')
    .references(() => ficheActionTable.id)
    .notNull(),
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

export type FicheActionNoteType = InferSelectModel<typeof ficheActionNoteTable>;
export type UpsertFicheActionNoteType = z.infer<
  typeof upsertFicheActionNoteSchema
>;
export type DeleteFicheActionNoteType = z.infer<
  typeof deleteFicheActionNoteSchema
>;
