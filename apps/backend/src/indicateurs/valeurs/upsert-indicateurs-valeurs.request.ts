import { indicateurValeurSchemaCreate } from '@/domain/indicateurs';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const upsertIndicateursValeursRequestSchema = z
  .object({
    valeurs: z
      .array(indicateurValeurSchemaCreate)
      .min(1)
      .describe('Liste de valeurs'),
  })
  .describe('Valeurs des indicateurs à insérer ou mettre à jour');

export type UpsertIndicateursValeursRequestType = z.infer<
  typeof upsertIndicateursValeursRequestSchema
>;

export class UpsertIndicateursValeursRequest extends createZodDto(
  upsertIndicateursValeursRequestSchema
) {}
