import {
  IndicateurValeurWithoutReferenceTypes,
  indicateurValeurSchemaCreate,
} from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const upsertValeurFieldSchema = z.object({
  ...z.pick(indicateurValeurSchemaCreate, {
    collectiviteId: true,
    indicateurId: true,
  }).shape,

  dateValeur: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)),
  field: z.enum(IndicateurValeurWithoutReferenceTypes),
  valeur: z.number(),
});

export type UpsertValeurField = z.infer<typeof upsertValeurFieldSchema>;
