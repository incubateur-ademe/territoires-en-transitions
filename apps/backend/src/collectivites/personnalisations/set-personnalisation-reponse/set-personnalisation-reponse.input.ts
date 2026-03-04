import { reponseValueSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

export const setPersonnalisationReponseInputSchema = z.object({
  collectiviteId: z
    .number()
    .positive("L'ID de la collectivité doit être positif"),
  questionId: z.string().min(1, "L'ID de la question est requis"),
  reponse: reponseValueSchema,
  justification: z.string().optional(),
});

export type SetPersonnalisationReponseInput = z.infer<
  typeof setPersonnalisationReponseInputSchema
>;
