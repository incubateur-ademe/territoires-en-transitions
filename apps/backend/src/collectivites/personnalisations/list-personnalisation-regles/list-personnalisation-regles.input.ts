import { z } from 'zod';

export const listPersonnalisationReglesInputSchema = z
  .object({
    actionIds: z.array(z.string().min(1)).optional(),
  })
  .optional();

export type ListPersonnalisationReglesInput = z.infer<
  typeof listPersonnalisationReglesInputSchema
>;
