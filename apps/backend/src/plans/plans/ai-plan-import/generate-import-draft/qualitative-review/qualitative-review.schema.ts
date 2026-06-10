import { z } from 'zod';

export const qualitativeReviewResponseSchema = z.object({
  avis: z.string(),
});
