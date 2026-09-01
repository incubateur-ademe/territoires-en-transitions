import z from 'zod';

export const listMesureDocumentsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  actionId: z.string().min(1),
  withSubActions: z.boolean().optional(),
});

export type ListMesureDocumentsInput = z.infer<
  typeof listMesureDocumentsInputSchema
>;
