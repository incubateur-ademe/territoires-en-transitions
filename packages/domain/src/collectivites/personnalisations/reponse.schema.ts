import * as z from 'zod/mini';
import { QuestionType } from './question.schema';

export const reponseValueSchema = z.union([
  z.boolean(),
  z.string(),
  z.number().check(z.minimum(0), z.maximum(1)),
  z.null(),
]);

export type PersonnalisationReponseValue = z.infer<typeof reponseValueSchema>;

export type PersonnalisationReponse = {
  questionId: string;
  questionType: QuestionType;
  reponse: PersonnalisationReponseValue;
  justification: string | null;
};
