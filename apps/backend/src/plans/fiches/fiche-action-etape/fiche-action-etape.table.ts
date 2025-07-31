import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@/backend/utils/column.utils';
import { InferSelectModel } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { ficheActionTable } from '../shared/models/fiche-action.table';

export const ficheActionEtapeTable = pgTable('fiche_action_etape', {
  id: serial('id').primaryKey(),
  ficheId: integer('fiche_id')
    .notNull()
    .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
  nom: text('nom'),
  ordre: integer('ordre').notNull(),
  realise: boolean('realise').notNull().default(false),
  createdAt,
  modifiedAt,
  createdBy,
  modifiedBy,
});

export const upsertFicheActionEtapeSchema = createInsertSchema(
  ficheActionEtapeTable
).partial({
  modifiedBy: true,
  createdBy: true,
});

export type FicheActionEtapeType = InferSelectModel<
  typeof ficheActionEtapeTable
>;
export type UpsertFicheActionEtapeType = z.infer<
  typeof upsertFicheActionEtapeSchema
>;
