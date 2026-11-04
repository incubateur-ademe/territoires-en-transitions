import { z } from 'zod';

export const enqueueImportOutputSchema = z.discriminatedUnion('profile', [
  z.object({
    profile: z.literal('generic'),
    jobId: z.string().uuid(),
    planId: z.number().int().positive(),
  }),
  z.object({
    profile: z.literal('annexe-3-electrification'),
    jobId: z.string().uuid(),
    planId: z.null(),
  }),
]);

export type EnqueueImportOutput = z.infer<typeof enqueueImportOutputSchema>;
