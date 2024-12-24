import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const getScoreSnapshotRequestSchema = extendApi(
  z.object({
    forceRecalculScoreCourant: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`Force le recalcul du score courant`),
  })
).describe('Paramètres de la requête pour obtenir un snapshots de score');
export type GetScoreSnapshotRequestType = z.infer<
  typeof getScoreSnapshotRequestSchema
>;
