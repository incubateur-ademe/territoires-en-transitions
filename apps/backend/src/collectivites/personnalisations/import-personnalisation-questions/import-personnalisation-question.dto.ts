import { getZodEnumArrayFromQueryString } from '@tet/backend/utils/zod.utils';
import {
  collectiviteTypeEnumSchema,
  questionChoixCreateSchema,
  questionCreateSchema,
} from '@tet/domain/collectivites';
import z from 'zod';

// Schema for importing questions from spreadsheet
export const importPersonnalisationQuestionSchema = z.object({
  ...questionCreateSchema.shape,

  // Override types_collectivites_concernees to handle comma-separated string from spreadsheet
  typesCollectivitesConcernees: getZodEnumArrayFromQueryString(
    collectiviteTypeEnumSchema
  )
    .optional()
    .nullable(),
});

export type ImportPersonnalisationQuestion = z.infer<
  typeof importPersonnalisationQuestionSchema
>;

// Schema for importing choices from spreadsheet
export const importPersonnalisationChoixSchema = questionChoixCreateSchema;

export type ImportPersonnalisationChoix = z.infer<
  typeof importPersonnalisationChoixSchema
>;
