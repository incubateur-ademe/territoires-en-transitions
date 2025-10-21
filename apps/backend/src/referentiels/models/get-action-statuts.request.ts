import { z } from 'zod';

export const getActionStatutsRequestSchema = z
  .object({
    date: z.iso.datetime().optional(),
  })
  .describe('Date pour laquelle le statut des actions est demandé');
export type GetActionStatutsRequestType = z.infer<
  typeof getActionStatutsRequestSchema
>;
