import { z } from 'zod';

export const avisFileUrlSchema = z.object({
  url: z.string(),
  filename: z.string(),
});

export type AvisFileUrl = z.infer<typeof avisFileUrlSchema>;
