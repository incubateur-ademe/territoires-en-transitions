import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { modifiedSinceSchema } from '../../common/models/modified-since.enum';
import { FicheActionCiblesEnumType } from './fiche-action.table';

export const getFichesActionFilterRequestSchema = extendApi(
  z
    .object({
      cibles: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.nativeEnum(FicheActionCiblesEnumType).array())
        .optional()
        .openapi({
          description: 'Liste des cibles séparées par des virgules',
        }),

      partenaire_tag_ids: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.coerce.number().array())
        .optional()
        .openapi({
          description:
            'Liste des identifiants de tags de partenaires séparés par des virgules',
        }),
      pilote_tag_ids: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.coerce.number().array())
        .optional()
        .openapi({
          description:
            'Liste des identifiants de tags des personnes pilote séparées par des virgules',
        }),
      pilote_user_ids: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.string().array())
        .optional()
        .openapi({
          description:
            'Liste des identifiants des utilisateurs pilote séparées par des virgules',
        }),
      service_tag_ids: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.coerce.number().array())
        .optional()
        .openapi({
          description:
            'Liste des identifiants de tags de services séparés par des virgules',
        }),
      plan_ids: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.coerce.number().array())
        .optional()
        .openapi({
          description:
            "Liste des identifiants des plans d'action séparés par des virgules",
        }),
      modified_after: z.string().datetime().optional().openapi({
        description: 'Uniquement les fiches modifiées après cette date',
      }),
      modified_since: modifiedSinceSchema.optional().openapi({
        description:
          'Filtre sur la date de modification en utilisant des valeurs prédéfinies',
      }),
    })
    .openapi({
      title: 'Filtre de récupération des fiches action',
    })
);
export type GetFichesActionFilterRequestType = z.infer<
  typeof getFichesActionFilterRequestSchema
>;
