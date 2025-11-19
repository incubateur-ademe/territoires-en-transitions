import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { integer, pgView, text } from 'drizzle-orm/pg-core';
import { axeTable } from './axe.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheRecursiveAxeView = pgView('fiche_recursive_axe', {
  ficheId: integer('fiche_id').references(() => ficheActionTable.id),
  id: integer('id').references(() => axeTable.id),
  nom: text('nom'),
  parentId: integer('parent_id').references(() => axeTable.id),
  planId: integer('plan_id').references(() => axeTable.id),
  collectiviteId: integer('collectivite_id').references(
    () => collectiviteTable.id
  ),
  axeLevel: integer('axe_level'),
}).existing();
