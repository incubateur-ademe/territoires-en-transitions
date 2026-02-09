import { z } from 'zod';

export const financeurRowFormSchema = z.object({
  tempId: z.string().optional(),
  financeurTagId: z.number({
    error: 'Le financeur est requis',
  }),
  montantTtc: z.number({
    error: 'Le montant de subvention obtenu est requis',
  }),
});

export const temporaryFinanceurRowFormSchema = z.object({
  tempId: z.string(),
  financeurTagId: z.number().optional(),
  montantTtc: z.number().optional(),
  ficheId: z.number(),
});

export type TemporaryFinanceurRowFormValues = z.infer<
  typeof temporaryFinanceurRowFormSchema
>;
export type FinanceurRowFormValues = z.infer<typeof financeurRowFormSchema>;
