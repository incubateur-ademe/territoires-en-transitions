import { z } from 'zod';

export const listReferentsOrganismesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  regionCode: z.string().min(1).max(2),
});

export type ListReferentsOrganismesInput = z.infer<
  typeof listReferentsOrganismesInputSchema
>;
