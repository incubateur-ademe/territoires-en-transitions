import { z } from 'zod';

export const switchToTeNotImplementedOutputSchema = z.object({
  status: z.literal('not_implemented'),
});

export type SwitchToTeNotImplementedOutput = z.infer<
  typeof switchToTeNotImplementedOutputSchema
>;
