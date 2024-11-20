import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const exportIndicateursRequestSchema = extendApi(
  z
    .object({
      collectiviteId: z.number().int().openapi({
        description: 'Identifiant de la collectivité',
      }),
      indicateurIds: z.number().int().array().openapi({
        description: 'Identifiants des indicateurs',
      }),
    })
    .openapi({
      title: 'Export des indicateurs',
    })
);
export type ExportIndicateursRequestType = z.infer<
  typeof exportIndicateursRequestSchema
>;
