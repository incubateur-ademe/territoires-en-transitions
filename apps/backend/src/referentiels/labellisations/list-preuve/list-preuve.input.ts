import z from 'zod';

export const listPreuveLabellisationInputSchema = z.object({
  demandeId: z.number(),
});

export type ListPreuveLabellisationInput = z.infer<
  typeof listPreuveLabellisationInputSchema
>;
