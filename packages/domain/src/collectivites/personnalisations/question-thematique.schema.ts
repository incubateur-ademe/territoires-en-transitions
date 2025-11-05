import * as z from 'zod/mini';

export const questionThematiqueSchema = z.object({
  id: z.string(),
  nom: z.nullable(z.string()),
});

export type QuestionThematique = z.infer<typeof questionThematiqueSchema>;

export const questionThematiqueCreateSchema = z.partial(
  questionThematiqueSchema,
  {
    id: true,
    nom: true,
  }
);

export type QuestionThematiqueCreate = z.infer<
  typeof questionThematiqueCreateSchema
>;
