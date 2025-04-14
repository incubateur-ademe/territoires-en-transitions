import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { indicateurValeurSchemaInsert } from './indicateur-valeur.table';

export const upsertIndicateursValeursRequestSchema = z
  .object({
    valeurs: z
      .array(indicateurValeurSchemaInsert)
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
