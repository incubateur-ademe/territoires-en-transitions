import { extendApi } from '@anatine/zod-openapi';
import { createZodDto } from '@anatine/zod-nestjs';
import { actionInPanierRequestSchema } from './action-in-panier.request';
import { z } from 'zod';

export const ActionInPanierStatutRequestSchema = extendApi(
  actionInPanierRequestSchema.extend({
    categorieId: z
      .string()
      .optional()
      .openapi({ description: `Identifiant du statut` }),
  }).openapi({
    title: `Statut d'une action à impact dans un panier.`,
  }),
);

export class ActionInPanierStatutRequestClass extends createZodDto(
  ActionInPanierStatutRequestSchema,
) {}
