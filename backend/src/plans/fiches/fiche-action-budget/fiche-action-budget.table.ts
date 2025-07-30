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

export const ficheActionBudgetTable = pgTable('fiche_action_budget', {
  id: serial('id').primaryKey(),
  ficheId: integer('fiche_id')
    .notNull()
    .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // TODO check enum BudgetType
  unite: text('unite').notNull(), // TODO check enum BudgetUnite
  annee: integer('annee'),
  budgetPrevisionnel: numeric('budget_previsionnel', {
    precision: 14,
    scale: 2,
  }),
  budgetReel: numeric('budget_reel', {
    precision: 14,
    scale: 2,
  }),
  estEtale: boolean('est_etale').notNull().default(false),
});

export const ficheActionBudgetSchema = createInsertSchema(
  ficheActionBudgetTable,
  {
    id: z.number().optional(),
    type: budgetTypeSchema,
    unite: budgetUniteSchema,
    budgetPrevisionnel: z
      .union([z.string(), z.number()])
      .transform((val) => val.toString())
      .refine((val) => !isNaN(Number(val)), {
        message: "Expected 'budgetPrevisionnel' to be a numeric string",
      }),
    budgetReel: z
      .union([z.string(), z.number()])
      .transform((val) => val.toString())
      .refine((val) => !isNaN(Number(val)), {
        message: "Expected 'budgetReel' to be a numeric string",
      }),
  }
);

export type FicheActionBudget = z.infer<typeof ficheActionBudgetSchema>;
