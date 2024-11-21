import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { ficheActionTable } from '../models/fiche-action.table';
import { createdAt, createdBy, modifiedAt, modifiedBy } from '@tet/backend/common/models/column.helpers';

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
