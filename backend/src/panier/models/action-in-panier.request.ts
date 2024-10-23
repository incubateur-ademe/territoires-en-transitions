import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const actionInPanierRequestSchema = extendApi(
  z
    .object({
      actionImpactId: z
        .number()
        .openapi({ description: `Identifiant de l'action à impact` }),
      panierId: z.string().openapi({ description: `Identifiant du panier` }),
    })
    .openapi({
      title: 'Action à impact dans un panier.',
    })
);

export class ActionInPanierRequestClass extends createZodDto(
  actionInPanierRequestSchema
) {}
