import z from 'zod';

export const listDocumentsDemandeLabellisationInputSchema = z.object({
  demandeId: z.number().int().positive(),
});

export type ListDocumentsDemandeLabellisationInput = z.infer<
  typeof listDocumentsDemandeLabellisationInputSchema
>;
