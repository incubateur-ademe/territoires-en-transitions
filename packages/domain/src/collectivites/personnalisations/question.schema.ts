import * as z from 'zod/mini';
import { collectiviteTypeEnumSchema } from '../collectivite-type.enum';

export const questionTypeEnumValues = [
  'choix',
  'binaire',
  'proportion',
] as const;
export const questionTypeEnumSchema = z.enum(questionTypeEnumValues);

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
});

export type Question = z.infer<typeof questionSchema>;

export const questionCreateSchema = z.partial(questionSchema, {
  thematiqueId: true,
  ordonnancement: true,
  typesCollectivitesConcernees: true,
  version: true,
});

export type QuestionCreate = z.infer<typeof questionCreateSchema>;
