import { z } from 'zod';

const collectiviteMobilisationSchema = z.object({
  collectiviteId: z.number().int().positive(),
  calculatedAt: z.date(),
  ficheIds: z.array(z.number().int().positive()),
});

export type CollectiviteMobilisation = z.output<
  typeof collectiviteMobilisationSchema
>;

export const mobilisationStateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('never_calculated'),
    calculatedAt: z.optional(z.undefined()),
    ficheIds: z.optional(z.undefined()),
  }),
  collectiviteMobilisationSchema
    .omit({ collectiviteId: true })
    .extend({ kind: z.literal('calculated') }),
]);

export type MobilisationState = z.output<typeof mobilisationStateSchema>;
