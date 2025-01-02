import { z } from 'zod';

export const getActionStatutsRequestSchema = z
  .object({
    date: z.string().datetime().optional(),
  })
  .describe('Date pour laquelle le statut des actions est demandé');
export type GetActionStatutsRequestType = z.infer<
  typeof getActionStatutsRequestSchema
>;
