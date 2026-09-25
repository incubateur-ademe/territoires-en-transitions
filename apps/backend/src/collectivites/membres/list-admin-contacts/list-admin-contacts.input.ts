import { z } from 'zod';

export const listAdminContactsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type ListAdminContactsInput = z.infer<
  typeof listAdminContactsInputSchema
>;
