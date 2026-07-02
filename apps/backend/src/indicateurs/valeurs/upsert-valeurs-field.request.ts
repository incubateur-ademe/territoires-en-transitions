import {
  IndicateurValeurWithoutReferenceTypes,
  indicateurValeurSchemaCreate,
} from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const upsertValeursFieldSchema = z.object({
  ...z.pick(indicateurValeurSchemaCreate, {
    collectiviteId: true,
  }).shape,

  valeurs: z
    .array(
      z.object({
        ...z.pick(indicateurValeurSchemaCreate, {
          indicateurId: true,
        }).shape,

        dateValeur: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)),
        field: z.enum(IndicateurValeurWithoutReferenceTypes),
        valeur: z.number(),
      })
    )
    .check(z.minLength(1)),
});

export type UpsertValeursField = z.infer<typeof upsertValeursFieldSchema>;
