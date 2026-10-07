import { z } from 'zod';

export const switchToTeOutputSchema = z.object({
  status: z.literal('switched'),
  populatedAt: z.iso.datetime(),
  populatedBy: z.string(),
});

export type SwitchToTeOutput = z.infer<typeof switchToTeOutputSchema>;
