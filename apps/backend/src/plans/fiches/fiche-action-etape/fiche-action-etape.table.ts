import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@/backend/utils/column.utils';
import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
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
