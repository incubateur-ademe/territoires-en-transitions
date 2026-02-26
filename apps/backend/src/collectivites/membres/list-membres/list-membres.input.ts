import { membreFonctionEnumSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

export const listMembresInputSchema = z.object({
  collectiviteId: z.number(),
  estReferent: z
    .boolean()
    .optional()
    .describe('Filtre la liste par le statut "référent"'),
  fonction: z
    .optional(membreFonctionEnumSchema)
    .describe('Filtre la liste par fonction'),
});

export type ListMembresInput = z.infer<typeof listMembresInputSchema>;
