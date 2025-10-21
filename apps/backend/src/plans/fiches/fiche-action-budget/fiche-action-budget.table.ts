import {
  budgetTypeSchema,
  budgetUniteSchema,
} from '@/backend/plans/fiches/fiche-action-budget/budget.types';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { BudgetType, BudgetUnite } from './budget.types';

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

export const ficheActionBudgetSchema = createInsertSchema(
  ficheActionBudgetTable,
  {
    id: z.number().optional(),
    type: budgetTypeSchema,
    unite: budgetUniteSchema,
  }
);

export type FicheActionBudget = z.infer<typeof ficheActionBudgetSchema>;
