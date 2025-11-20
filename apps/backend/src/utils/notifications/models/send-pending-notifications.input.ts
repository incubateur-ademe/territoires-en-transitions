import { z } from 'zod';

export const sendPendingNotificationsInputSchema = z
  .object({
    delayInSeconds: z.number().optional(),
  })
  .optional();

export type SendPendingNotificationsInput = z.infer<
  typeof sendPendingNotificationsInputSchema
>;
