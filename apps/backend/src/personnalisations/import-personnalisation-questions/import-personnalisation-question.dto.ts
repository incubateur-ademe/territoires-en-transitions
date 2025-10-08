import { collectiviteTypeEnumSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import { createQuestionChoixSchema } from '@/backend/personnalisations/models/question-choix.table';
import { createQuestionSchema } from '@/backend/personnalisations/models/question.table';
import { getZodEnumArrayFromQueryString } from '@/backend/utils/zod.utils';
import z from 'zod';

// Schema for importing questions from spreadsheet
export const importPersonnalisationQuestionSchema = createQuestionSchema.extend(
  {
    // Override types_collectivites_concernees to handle comma-separated string from spreadsheet
    typesCollectivitesConcernees: getZodEnumArrayFromQueryString(
      collectiviteTypeEnumSchema
    )
      .optional()
      .nullable(),
  }
);

export type ImportPersonnalisationQuestion = z.infer<
  typeof importPersonnalisationQuestionSchema
>;

// Schema for importing choices from spreadsheet
export const importPersonnalisationChoixSchema = createQuestionChoixSchema;

export type ImportPersonnalisationChoix = z.infer<
  typeof importPersonnalisationChoixSchema
>;
