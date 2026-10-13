import { z } from 'zod';

export const resumeImportInputSchema = z.object({
  jobId: z.string().uuid(),
});

export type ResumeImportInput = z.infer<typeof resumeImportInputSchema>;

export const findResumableImportInputSchema = z.object({
  planId: z.number().int().positive(),
});

export type FindResumableImportInput = z.infer<
  typeof findResumableImportInputSchema
>;
