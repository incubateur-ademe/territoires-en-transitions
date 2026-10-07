import * as z from 'zod';

export const getDownloadUrlInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  fichierId: z.number().int().positive(),
});

export type GetDownloadUrlInput = z.infer<typeof getDownloadUrlInputSchema>;
