import { type Result } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { FicheCandidate } from '../models/fiche-analysis';
import { FicheCandidateError } from './analyze-fiches.errors';

const collectiviteIdSchema = z.number().int().positive();

export const ficheCandidateSelectionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('every_fiche'),
    collectiviteId: collectiviteIdSchema,
    since: z.optional(z.undefined()),
  }),
  z.object({
    kind: z.literal('pending_since'),
    collectiviteId: collectiviteIdSchema,
    since: z.date(),
  }),
]);

export type FicheCandidateSelection = z.output<
  typeof ficheCandidateSelectionSchema
>;

export abstract class FicheCandidateRepository {
  abstract listCollectivitesWithFicheCandidates(): Promise<
    Result<number[], FicheCandidateError>
  >;

  abstract listFicheCandidates(
    selection: FicheCandidateSelection
  ): Promise<Result<FicheCandidate[], FicheCandidateError>>;
}
