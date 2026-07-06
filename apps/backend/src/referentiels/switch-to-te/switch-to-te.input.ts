import { z } from 'zod';

export const switchToTeInputSchema = z.object({
  collectiviteId: z.number(),
});

export type SwitchToTeInput = z.infer<typeof switchToTeInputSchema>;
