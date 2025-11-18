import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { BudgetType, BudgetUnite } from '@tet/domain/plans';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';

export const ficheActionBudgetTable = pgTable('fiche_action_budget', {
  id: serial('id').primaryKey(),
  ficheId: integer('fiche_id')
    .notNull()
    .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
  type: text('type').notNull().$type<BudgetType>(), // TODO check enum BudgetType
  unite: text('unite').notNull().$type<BudgetUnite>(), // TODO check enum BudgetUnite
  annee: integer('annee'),
  budgetPrevisionnel: numeric('budget_previsionnel', {
    precision: 14,
    scale: 2,
    mode: 'number',
  }),
  budgetReel: numeric('budget_reel', {
    precision: 14,
    scale: 2,
    mode: 'number',
  }),
  estEtale: boolean('est_etale').notNull().default(false),
});
