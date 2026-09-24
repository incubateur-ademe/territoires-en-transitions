import { type Result } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { FicheCandidate } from '../models/fiche-analysis';
import { FicheCandidateError } from './analyze-fiches.errors';
import { collectiviteSelectionSchema } from './analyze-fiches.input';

export const ficheCandidateSelectionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('every_fiche'),
    collectivites: collectiviteSelectionSchema,
    since: z.optional(z.undefined()),
  }),
  z.object({
    kind: z.literal('pending_since'),
    since: z.date(),
    collectivites: z.optional(z.undefined()),
  }),
]);

export type FicheCandidateSelection = z.output<
  typeof ficheCandidateSelectionSchema
>;

export abstract class FicheCandidateRepository {
  abstract listFicheCandidates(
    selection: FicheCandidateSelection
  ): Promise<Result<FicheCandidate[], FicheCandidateError>>;
}
