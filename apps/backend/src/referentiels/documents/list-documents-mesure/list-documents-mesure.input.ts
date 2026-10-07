import z from 'zod';

export const listDocumentsMesureInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  actionId: z.string().min(1),
  withSubActions: z.boolean().optional(),
});

export type ListDocumentsMesureInput = z.infer<
  typeof listDocumentsMesureInputSchema
>;
