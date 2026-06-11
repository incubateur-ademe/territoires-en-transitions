import { z } from 'zod';
import { extractedActionSchema } from '../models/extracted-action';

export const confirmImportInputSchema = z.object({
  jobId: z.string().uuid(),
  planName: z.string().min(1),
  planType: z.number().int().positive().optional(),
  actions: z.array(extractedActionSchema),
});

export type ConfirmImportInput = z.output<typeof confirmImportInputSchema>;
