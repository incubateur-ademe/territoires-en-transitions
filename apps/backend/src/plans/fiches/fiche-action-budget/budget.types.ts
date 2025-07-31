import z from 'zod';

export const budgetTypes = ['investissement', 'fonctionnement'] as const;
export const budgetTypeSchema = z.enum(budgetTypes);
export type BudgetType = z.infer<typeof budgetTypeSchema>;

export const budgetUnites = ['HT', 'ETP'] as const;
export const budgetUniteSchema = z.enum(budgetUnites);
export type BudgetUnite = z.infer<typeof budgetUniteSchema>;
