import { z } from 'zod';

export const getSiteCollectiviteInputSchema = z.object({
  codeSirenInsee: z.string().min(1).max(20),
});

export type GetSiteCollectiviteInput = z.infer<
  typeof getSiteCollectiviteInputSchema
>;
