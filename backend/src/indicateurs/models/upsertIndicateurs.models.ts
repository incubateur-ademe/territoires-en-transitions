import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { createIndicateurValeurSchema } from './indicateur.models';
extendZodWithOpenApi(z);

export const upsertIndicateursValeursRequestSchema = extendApi(
  z
    .object({
      valeurs: extendApi(
        z.array(createIndicateurValeurSchema).min(1).openapi({
          description: 'Liste de valeurs',
        }),
      ),
    })
    .openapi({
      title: 'Valeurs des indicateurs à insérer ou mettre à jour',
    }),
);
export class UpsertIndicateursValeursRequest extends createZodDto(
  upsertIndicateursValeursRequestSchema,
) {}

export type UpsertIndicateursValeursResponse = UpsertIndicateursValeursRequest;