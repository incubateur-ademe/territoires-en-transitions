import * as z from 'zod';

export const listBibliothequeDocumentsOutputSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      filename: z.string(),
      confidentiel: z.boolean(),
    })
  ),
});

export type ListBibliothequeDocumentsOutput = z.infer<
  typeof listBibliothequeDocumentsOutputSchema
>;
