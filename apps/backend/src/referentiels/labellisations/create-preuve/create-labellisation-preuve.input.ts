import z from 'zod';

export const createLabellisationPreuveInputSchema = z.object({
  fichierId: z.number().int().positive(),
  commentaire: z.optional(z.string()),
  demandeId: z.number().int().positive(),
});

export type CreateLabellisationPreuveInput = z.infer<
  typeof createLabellisationPreuveInputSchema
>;
