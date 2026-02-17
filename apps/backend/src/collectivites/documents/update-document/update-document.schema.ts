import { z } from 'zod';

export const updateDocumentInputSchema = z
  .object({
    collectiviteId: z.number().int().positive(),
    hash: z.string().min(1),
    filename: z.string().min(1).optional(),
    confidentiel: z.boolean().optional(),
  })
  .refine(
    (data) => data.filename !== undefined || data.confidentiel !== undefined,
    {
      message: 'Au moins un de filename ou confidentiel doit être fourni',
    }
  );

export type UpdateDocumentInputSchema = z.infer<
  typeof updateDocumentInputSchema
>;
