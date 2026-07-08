import { z } from 'zod';

const scoringEntrySchema = z.object({
  index: z.number().int(),
  score: z.number().int().min(0).max(100),
  explication: z.string(),
});

export const scoringResponseSchema = z.array(scoringEntrySchema);

export type ScoringEntry = z.output<typeof scoringEntrySchema>;
