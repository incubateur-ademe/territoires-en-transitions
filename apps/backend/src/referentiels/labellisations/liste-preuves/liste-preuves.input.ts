import z from 'zod';

export const listePreuvesLabellisationInputSchema = z.object({
  demandeId: z.number().int().positive(),
});

export type ListePreuvesLabellisationInput = z.infer<
  typeof listePreuvesLabellisationInputSchema
>;
