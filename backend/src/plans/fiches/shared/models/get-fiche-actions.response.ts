import z from 'zod';
import { ficheActionWithRelationsSchema } from './fiche-action-with-relations.dto';

export const getFichesActionResponseSchema = z.object({
  count: z.number(),
  data: z.array(ficheActionWithRelationsSchema),
});

export type GetFichesActionResponse = z.infer<
  typeof getFichesActionResponseSchema
>;
