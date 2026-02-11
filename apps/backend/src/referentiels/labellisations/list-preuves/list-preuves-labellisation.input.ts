import z from 'zod';

export const listPreuvesLabellisationInputSchema = z.object({
  demandeId: z.number().int().positive(),
});

export type ListPreuvesLabellisationInput = z.infer<
  typeof listPreuvesLabellisationInputSchema
>;
