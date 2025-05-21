import z from 'zod';
import {
  ficheResumeSchema,
  ficheWithRelationsSchema,
} from '../../list-fiches/fiche-action-with-relations.dto';

export const getFichesActionResponseSchema = z.object({
  count: z.number(),
  data: z.array(ficheWithRelationsSchema),
});

export const getFichesActionResumeResponseSchema = z.object({
  count: z.number(),
  data: z.array(ficheResumeSchema),
});

export type GetFichesActionResponse = z.infer<
  typeof getFichesActionResponseSchema
>;

export type GetFichesActionResumeResponse = z.infer<
  typeof getFichesActionResumeResponseSchema
>;
