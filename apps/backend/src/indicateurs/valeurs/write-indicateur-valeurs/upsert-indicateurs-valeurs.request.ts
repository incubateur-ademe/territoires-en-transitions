import {
  indicateurPeriodiciteSchema,
  indicateurValeurSchemaCreate,
} from '@tet/domain/indicateurs';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const upsertIndicateursValeursRequestSchema = z
  .object({
    valeurs: z
      .array(
        z.object({
          ...indicateurValeurSchemaCreate.shape,
          metadonneeId: indicateurValeurSchemaCreate.shape.metadonneeId
            .clone()
            .register(z.globalRegistry, {
              description:
                'Identifiant de provenance réservé aux intégrations autorisées à importer des données. Omettre ce champ ou utiliser null pour une saisie utilisateur.',
            }),
          periodicite: z.optional(indicateurPeriodiciteSchema),
        })
      )
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
