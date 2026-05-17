import { personnalisationReponsesPayloadSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

export const listPersonnalisationReponsesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  questionIds: z.array(z.string().min(1)).optional(),
  reponsesEffectives: z.optional(personnalisationReponsesPayloadSchema),
});

export type ListPersonnalisationReponsesInput = z.infer<
  typeof listPersonnalisationReponsesInputSchema
>;
