import z from 'zod';

export const createLabellisationPreuveInputSchema = z.object({
  fichierId: z.number(),
  commentaire: z.optional(z.string()),
  demandeId: z.number(),
});

export type CreateLabellisationPreuveInput = z.infer<
  typeof createLabellisationPreuveInputSchema
>;
