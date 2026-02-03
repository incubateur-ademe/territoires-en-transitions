import { z } from 'zod';

export const financeurRowFormSchema = z.object({
  ficheId: z.number(),
  draftId: z.string().optional(),
  financeurTagId: z.number({
    error: 'Le financeur est requis',
  }),
  montantTtc: z.number({
    error: 'Le montant de subvention obtenu est requis',
  }),
});

export const draftFinanceurRowFormSchema = z.object({
  draftId: z.string(),
  financeurTagId: z.number().optional(),
  montantTtc: z.number().optional(),
  ficheId: z.number(),
});

export type DraftFinanceurRowFormValues = z.infer<
  typeof draftFinanceurRowFormSchema
>;
export type FinanceurRowFormValues = z.infer<typeof financeurRowFormSchema>;
