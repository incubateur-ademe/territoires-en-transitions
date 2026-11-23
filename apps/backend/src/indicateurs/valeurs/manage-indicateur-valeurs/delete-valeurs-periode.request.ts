import {
  indicateurValeurSchemaCreate,
  MAX_GRID_VALEURS_BATCH_SIZE,
} from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const deleteValeursPeriodeSchema = z.object({
  collectiviteId: indicateurValeurSchemaCreate.shape.collectiviteId,
  indicateurIds: z
    .array(indicateurValeurSchemaCreate.shape.indicateurId)
    .check(z.minLength(1), z.maxLength(MAX_GRID_VALEURS_BATCH_SIZE)),
  dateValeur: indicateurValeurSchemaCreate.shape.dateValeur,
});

export type DeleteValeursPeriode = z.infer<typeof deleteValeursPeriodeSchema>;
