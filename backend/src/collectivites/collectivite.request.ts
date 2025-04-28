import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const collectiviteRequestSchema = z.object({
  collectiviteId: z.coerce
    .number()
    .int()
    .describe('Identifiant de la collectivité'),
});
export type CollectiviteRequestType = z.infer<typeof collectiviteRequestSchema>;

export const partialCollectiviteRequestSchema =
  collectiviteRequestSchema.partial();

export class CollectiviteRequestClass extends createZodDto(
  collectiviteRequestSchema
) {}
