import { createEnumObject } from '@/backend/utils/enum.utils';
import { pgEnum } from 'drizzle-orm/pg-core';

export const questionTypeValues = ['choix', 'binaire', 'proportion'] as const;

export const QuestionTypeEnum = createEnumObject(questionTypeValues);

export const questionTypePgEnum = pgEnum('question_type', questionTypeValues);
