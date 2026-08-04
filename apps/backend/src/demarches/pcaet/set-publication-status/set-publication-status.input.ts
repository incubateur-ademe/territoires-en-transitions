import { demarchePcaetPublicationStatusSchema } from '@tet/domain/demarches';
import { z } from 'zod';

export const setPublicationStatusInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  publicationStatus: demarchePcaetPublicationStatusSchema,
});

export type SetPublicationStatusInput = z.infer<
  typeof setPublicationStatusInputSchema
>;
