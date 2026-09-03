import { z } from 'zod';

const consolidationEntrySchema = z.object({
  index: z.number().int().min(0),
  titre: z.string(),
  description: z.string(),
  'sous-actions': z.array(z.string()),
});

export const consolidationResponseSchema = z.array(consolidationEntrySchema);

export type ConsolidationEntry = z.output<typeof consolidationEntrySchema>;
