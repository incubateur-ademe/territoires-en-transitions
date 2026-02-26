import { z } from 'zod';

export const listPendingInvitationsInputSchema = z.object({
  collectiviteId: z.number(),
});

export type ListPendingInvitationsInput = z.infer<
  typeof listPendingInvitationsInputSchema
>;
