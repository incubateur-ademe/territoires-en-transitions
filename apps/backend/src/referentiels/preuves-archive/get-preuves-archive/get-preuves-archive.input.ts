import { z } from 'zod';

export const getPreuvesArchiveInputSchema = z.object({
  archiveId: z.string().uuid(),
});

export type GetPreuvesArchiveInput = z.infer<
  typeof getPreuvesArchiveInputSchema
>;
