import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const createPlanFromPanierRequestSchema = extendApi(
  z
    .object({
      collectiviteId: z
        .number()
        .openapi({ description: `Identifiant de la collectivité` }),
      panierId: z.string().openapi({ description: `Identifiant du panier` }),
      planId: z.number().optional().openapi({
        description: `Identifiant du plan, vide pour créer un nouveau plan`,
      }),
    })
    .openapi({
      title: 'Panier à transformer en plan pour une collectivité.',
    }),
);

export class CreatePlanFromPanierRequestClass extends createZodDto(
  createPlanFromPanierRequestSchema,
) {}