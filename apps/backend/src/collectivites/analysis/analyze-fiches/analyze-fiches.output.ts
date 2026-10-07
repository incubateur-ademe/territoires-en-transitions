import { z } from 'zod';

const idsSchema = z.array(z.number().int().positive());

export const analyzeFichesOutputSchema = z.object({
  classifiedFicheIds: idsSchema,
  failedFicheIds: idsSchema,
  removedFicheIds: idsSchema,
  recalculatedCollectiviteIds: idsSchema,
  failedCollectiviteIds: idsSchema,
});

export type AnalyzeFichesOutput = z.output<typeof analyzeFichesOutputSchema>;
