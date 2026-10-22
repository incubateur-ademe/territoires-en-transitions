import { z } from 'zod';

export const listContactsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type ListContactsInput = z.infer<typeof listContactsInputSchema>;
