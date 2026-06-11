import { z } from 'zod';

export const confirmImportOutputSchema = z.object({
  planId: z.number(),
  fichesCount: z.number(),
});

export type ConfirmImportOutput = z.output<typeof confirmImportOutputSchema>;
