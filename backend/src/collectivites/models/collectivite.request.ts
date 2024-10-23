import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const collectiviteRequestSchema = extendApi(
  z.object({
    collectivite_id: z.coerce.number().int().openapi({
      description: 'Identifiant de la collectivité',
    }),
  })
);
export type CollectiviteRequestType = z.infer<typeof collectiviteRequestSchema>;

export class CollectiviteRequestClass extends createZodDto(
  collectiviteRequestSchema
) {}
