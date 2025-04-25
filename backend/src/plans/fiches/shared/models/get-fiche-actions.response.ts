import z from 'zod';
import {
  ficheActionResumeSchema,
  ficheActionWithRelationsSchema,
} from './fiche-action-with-relations.dto';

export const getFichesActionResponseSchema = z.object({
  count: z.number(),
  data: z.array(ficheActionWithRelationsSchema),
});

export const getFichesActionResumeResponseSchema = z.object({
  count: z.number(),
  data: z.array(ficheActionResumeSchema),
});

export type GetFichesActionResponse = z.infer<
  typeof getFichesActionResponseSchema
>;

export type GetFichesActionResumeResponse = z.infer<
  typeof getFichesActionResumeResponseSchema
>;
