import { z } from 'zod';

const invitationSendSchema = z.object({
  urlType: z.literal('invitation'),
  invitationId: z.uuid(),
});

const rattachementSendSchema = z.object({
  urlType: z.literal('rattachement'),
  collectiviteId: z.number().int().positive(),
  to: z.email({ pattern: z.regexes.unicodeEmail }),
});

export const sendInvitationInputSchema = z.discriminatedUnion('urlType', [
  invitationSendSchema,
  rattachementSendSchema,
]);

export type SendInvitationInput = z.infer<typeof sendInvitationInputSchema>;
