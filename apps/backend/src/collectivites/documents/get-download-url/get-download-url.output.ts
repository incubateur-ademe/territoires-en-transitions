import * as z from 'zod';

export const getDownloadUrlOutputSchema = z.object({
  signedUrl: z.string().min(1),
  filename: z.string().min(1),
});

export type GetDownloadUrlOutput = z.infer<typeof getDownloadUrlOutputSchema>;
