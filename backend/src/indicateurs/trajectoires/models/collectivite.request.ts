import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const collectiviteRequestSchema = extendApi(
  z.object({
    collectiviteId: z.coerce
      .number()
      .int()
      .describe('Identifiant de la collectivité'),
  })
);
export type CollectiviteRequestType = z.infer<typeof collectiviteRequestSchema>;

export class CollectiviteRequestClass extends createZodDto(
  collectiviteRequestSchema
) {}
