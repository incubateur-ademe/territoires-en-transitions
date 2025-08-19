import z from 'zod';

export const importCollectiviteRelationsRequestSchema = z
  .object({
    useDatagouvFile: z.boolean().optional(),
  })
  .optional();
