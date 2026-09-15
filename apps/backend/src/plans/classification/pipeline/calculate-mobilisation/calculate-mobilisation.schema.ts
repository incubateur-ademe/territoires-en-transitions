import { z } from 'zod';

const noteSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const mobilisationResponseSchema = z.object({
  '1': noteSchema,
  '2': noteSchema,
  '3': noteSchema,
  '4': noteSchema,
  '5': noteSchema,
  '6': noteSchema,
});

export type MobilisationResponse = z.infer<typeof mobilisationResponseSchema>;

export type Note = z.infer<typeof noteSchema>;
