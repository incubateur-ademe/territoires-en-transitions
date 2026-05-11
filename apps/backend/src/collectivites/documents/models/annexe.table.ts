import { integer, pgTable } from 'drizzle-orm/pg-core';
import { ficheActionTable } from '../../../plans/fiches/shared/models/fiche-action.table';
import { documentBase } from './document.basetable';

export const annexeTable = pgTable('annexe', {
  ...documentBase,
  ficheId: integer('fiche_id')
    .notNull()
    .references(() => ficheActionTable.id),
});
