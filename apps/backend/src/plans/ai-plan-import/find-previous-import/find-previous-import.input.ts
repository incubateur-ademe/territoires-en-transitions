import { documentHashSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

/** Le fichier est désigné par sa ligne de bibliothèque ou par son hash. */
export const findPreviousImportInputSchema = z.union([
  z.object({
    collectiviteId: z.number().int().positive(),
    fichierId: z.number().int().positive(),
  }),
  z.object({
    collectiviteId: z.number().int().positive(),
    hash: documentHashSchema,
  }),
]);

export type FindPreviousImportInput = z.infer<
  typeof findPreviousImportInputSchema
>;
