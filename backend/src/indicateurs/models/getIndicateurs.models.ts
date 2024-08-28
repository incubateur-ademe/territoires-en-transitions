import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { indicateurAvecValeursParSourceSchema } from './indicateur.models';

export const getIndicateursValeursRequestSchema = extendApi(
  z
    .object({
      collectivite_id: z.coerce.number().int().openapi({
        description: 'Identifiant de la collectivité',
      }),
      indicateur_id: z.coerce.number().int().optional().openapi({
        description: "Identifiant de l'indicateur",
      }),

      identifiants_referentiel: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.string().array())
        .optional()
        .openapi({
          description: 'Identifiants du référentiel',
        }),
      sources: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.string().array())
        .optional()
        .openapi({
          description:
            'Liste des sources (séparées par des virgules). collectivite pour les valeurs renseignées par la collectivité',
        }),
      date_debut: z.string().length(10).optional().openapi({
        description: 'Date de début (format YYYY-MM-DD)',
      }),
      date_fin: z.string().length(10).optional().openapi({
        description: 'Date de fin (format YYYY-MM-DD)',
      }), // z.string().date() only supported in 3.23
      ignore_dedoublonnage: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional()
        .openapi({
          description: 'Ignore le dédoublonnage',
        }),
    })
    .openapi({
      title: 'Filtre de récupération des valeurs des indicateurs',
    }),
);
export class GetIndicateursValeursRequestClass extends createZodDto(
  getIndicateursValeursRequestSchema,
) {}

export const getIndicateursValeursResponseSchema = extendApi(
  z
    .object({
      indicateurs: z.array(indicateurAvecValeursParSourceSchema),
    })
    .openapi({
      title: 'Valeurs par indicateur et par source',
    }),
);

export class GetIndicateursValeursResponse extends createZodDto(
  getIndicateursValeursResponseSchema,
) {}
