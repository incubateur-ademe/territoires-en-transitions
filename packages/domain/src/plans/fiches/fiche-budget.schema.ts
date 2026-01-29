import * as z from 'zod/mini';

export const budgetTypes = ['investissement', 'fonctionnement'] as const;
export const budgetTypeSchema = z.enum(budgetTypes);
export type BudgetType = z.infer<typeof budgetTypeSchema>;

export const budgetUnites = ['HT', 'ETP'] as const;
export const budgetUniteSchema = z.enum(budgetUnites);
export type BudgetUnite = z.infer<typeof budgetUniteSchema>;

type BudgetTypeWithTotal = BudgetType | 'total';
export type AggregatedBudget = { total: number; nbFiches: number };
export type BudgetWithTotal = {
  [key in BudgetTypeWithTotal]: {
    [key in BudgetUnite]: {
      budgetPrevisionnel: AggregatedBudget;
      budgetReel: AggregatedBudget;
    };
  };
};

export const ficheBudgetSchema = z.object({
  id: z.number(),
  ficheId: z.number(),
  type: budgetTypeSchema,
  unite: budgetUniteSchema,
  annee: z.nullable(z.number()),
  budgetPrevisionnel: z.nullable(z.number()),
  budgetReel: z.nullable(z.number()),
  estEtale: z.optional(z.boolean()),
});

export type FicheBudget = z.infer<typeof ficheBudgetSchema>;

export const ficheBudgetCreateSchema = z.partial(ficheBudgetSchema, {
  id: true,
  annee: true,
  budgetPrevisionnel: true,
  budgetReel: true,
  estEtale: true,
});

export type FicheBudgetCreate = z.infer<typeof ficheBudgetCreateSchema>;
