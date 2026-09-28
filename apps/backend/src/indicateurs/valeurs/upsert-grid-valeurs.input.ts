import {
  IndicateurPeriod,
  IndicateurPeriodJson,
  IndicateurValeurCreate,
  MAX_GRID_VALEURS_BATCH_SIZE,
  indicateurPeriodSchema,
  indicateurValeurSchemaCreate,
} from '@tet/domain/indicateurs';
import { z } from 'zod';

export { MAX_GRID_VALEURS_BATCH_SIZE };

type UpsertGridValeurInput = Pick<
  IndicateurValeurCreate,
  'indicateurId' | 'resultat' | 'objectif'
> & {
  period: IndicateurPeriod;
};

type UpsertGridValeurJson = Omit<UpsertGridValeurInput, 'period'> & {
  period: IndicateurPeriodJson;
};

const upsertGridValeurInputSchema: z.ZodType<
  UpsertGridValeurInput,
  UpsertGridValeurJson
> = z
  .object({
    indicateurId: indicateurValeurSchemaCreate.shape.indicateurId,
    period: indicateurPeriodSchema,
    resultat: indicateurValeurSchemaCreate.shape.resultat,
    objectif: indicateurValeurSchemaCreate.shape.objectif,
  })
  .refine(
    ({ resultat, objectif }) =>
      resultat !== undefined || objectif !== undefined,
    { message: 'Une cellule résultat ou objectif est requise' }
  );

export type UpsertGridValeursInput = {
  collectiviteId: IndicateurValeurCreate['collectiviteId'];
  valeurs: UpsertGridValeurInput[];
};

type UpsertGridValeursJson = Omit<UpsertGridValeursInput, 'valeurs'> & {
  valeurs: UpsertGridValeurJson[];
};

export const upsertGridValeursInputSchema: z.ZodType<
  UpsertGridValeursInput,
  UpsertGridValeursJson
> = z.object({
  collectiviteId: indicateurValeurSchemaCreate.shape.collectiviteId,
  valeurs: z
    .array(upsertGridValeurInputSchema)
    .min(1)
    .max(MAX_GRID_VALEURS_BATCH_SIZE),
});
