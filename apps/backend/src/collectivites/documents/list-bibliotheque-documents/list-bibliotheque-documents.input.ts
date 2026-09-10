import * as z from 'zod';

export const listBibliothequeDocumentsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  search: z.string().trim().max(255).optional(),
  limit: z.number().int().min(1).max(100),
});

export type ListBibliothequeDocumentsInput = z.infer<
  typeof listBibliothequeDocumentsInputSchema
>;
