import { ficheActionTable } from '@/backend/plans/fiches';
import { integer, pgTable } from 'drizzle-orm/pg-core';
import { DocumentBase } from './document.basetable';

export const annexeTable = pgTable('annexe', {
  ...DocumentBase,
  ficheId: integer('fiche_id')
    .notNull()
    .references(() => ficheActionTable.id),
});
