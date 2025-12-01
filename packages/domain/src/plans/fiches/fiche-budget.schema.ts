import * as z from 'zod/mini';

const budgetTypes = ['investissement', 'fonctionnement'] as const;
const budgetTypeSchema = z.enum(budgetTypes);

const budgetUnites = ['HT', 'ETP'] as const;
const budgetUniteSchema = z.enum(budgetUnites);

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
