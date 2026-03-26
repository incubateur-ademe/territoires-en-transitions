import * as z from 'zod/mini';
import { collectiviteTypeEnumSchema } from '../collectivite-type.enum';

export const questionTypeEnumValues = [
  'choix',
  'binaire',
  'proportion',
] as const;
export const questionTypeEnumSchema = z.enum(questionTypeEnumValues);
export type QuestionType = (typeof questionTypeEnumValues)[number];

export const questionSchema = z.object({
  id: z.string(),
  thematiqueId: z.nullable(z.string()),
  ordonnancement: z.nullable(z.number()),
  typesCollectivitesConcernees: z.optional(
    z.nullable(collectiviteTypeEnumSchema.array())
  ),
  type: questionTypeEnumSchema,
  description: z.string(),
  formulation: z.string(),
  version: z.string(),
  competenceCode: z.nullable(z.int()),
  consignesJustification: z.nullable(z.string()),
  exprVisible: z.nullable(z.string()),
});

export type Question = z.infer<typeof questionSchema>;

export const questionCreateSchema = z.partial(questionSchema, {
  thematiqueId: true,
  ordonnancement: true,
  typesCollectivitesConcernees: true,
  version: true,
  competenceCode: true,
  consignesJustification: true,
  exprVisible: true,
});

export type QuestionCreate = z.infer<typeof questionCreateSchema>;
