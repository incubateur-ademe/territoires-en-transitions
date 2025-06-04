import { z } from 'zod';

export const deleteApiKeyRequestSchema = z.object({
  clientId: z.string(),
});
export type DeleteApiKeyRequest = z.infer<typeof deleteApiKeyRequestSchema>;
