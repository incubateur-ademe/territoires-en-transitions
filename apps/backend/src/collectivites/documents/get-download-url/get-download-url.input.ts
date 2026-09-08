import { documentHashSchema } from '@tet/domain/collectivites';
import * as z from 'zod';

export const getDownloadUrlInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  hash: documentHashSchema,
});

export type GetDownloadUrlInput = z.infer<typeof getDownloadUrlInputSchema>;
