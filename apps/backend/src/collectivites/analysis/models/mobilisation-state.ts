import { z } from 'zod';

export const mobilisationStateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('never_calculated'),
    calculatedAt: z.optional(z.undefined()),
    ficheIds: z.optional(z.undefined()),
  }),
  z.object({
    kind: z.literal('calculated'),
    calculatedAt: z.date(),
    ficheIds: z.array(z.number().int().positive()),
  }),
]);

export type MobilisationState = z.output<typeof mobilisationStateSchema>;
