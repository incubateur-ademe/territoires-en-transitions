import { getEnumValues } from "@/backend/utils/enum.utils";
import { pgEnum } from "drizzle-orm/pg-core";

export const QuestionTypeEnum = {
  CHOIX: 'choix',
  BINAIRE: 'binaire',
  PROPORTION: 'proportion'
} as const;

export const questionTypeEnumValues = getEnumValues(QuestionTypeEnum);
export const questionTypePgEnum = pgEnum('question_type', questionTypeEnumValues);
