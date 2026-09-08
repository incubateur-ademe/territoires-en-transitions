import { documentHashSchema } from '@tet/domain/collectivites';
import * as z from 'zod';

export const createUploadTokenInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  hash: documentHashSchema,
});

export type CreateUploadTokenInput = z.infer<
  typeof createUploadTokenInputSchema
>;
