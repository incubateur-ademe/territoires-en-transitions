import z from 'zod';

export const getCollectiviteInputSchema = z.object({
  collectiviteId: z.number().optional(),
  siren: z.string().optional(),
  communeCode: z.string().optional(),
  withRelations: z.boolean().default(true).optional(),
});

export type GetCollectiviteInput = z.infer<typeof getCollectiviteInputSchema>;
