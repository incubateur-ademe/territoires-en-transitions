import { createIndicateurValeurSchema } from '@/backend/indicateurs';
import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const upsertIndicateursValeursRequestSchema = extendApi(
  z
    .object({
      valeurs: extendApi(
        z
          .array(createIndicateurValeurSchema)
          .min(1)
          .describe('Liste de valeurs')
      ),
    })
    .describe('Valeurs des indicateurs à insérer ou mettre à jour')
);
export type UpsertIndicateursValeursRequestType = z.infer<
  typeof upsertIndicateursValeursRequestSchema
>;

export class UpsertIndicateursValeursRequest extends createZodDto(
  upsertIndicateursValeursRequestSchema
) {}

export type UpsertIndicateursValeursResponse = UpsertIndicateursValeursRequest;
