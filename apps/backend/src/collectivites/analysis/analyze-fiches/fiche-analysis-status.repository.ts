import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import {
  failedFicheAnalysisSchema,
  FicheAnalysis,
  processedFicheAnalysisSchema,
  staleFicheAnalysisSchema,
} from '../models/fiche-analysis';
import { FicheAnalysisStatusError } from './analyze-fiches.errors';

export const ficheAnalysisUpsertSchema = z.discriminatedUnion('status', [
  processedFicheAnalysisSchema.pick({
    ficheId: true,
    collectiviteId: true,
    status: true,
    fingerprint: true,
  }),
  staleFicheAnalysisSchema
    .pick({ ficheId: true, collectiviteId: true, status: true })
    .extend({ fingerprint: z.optional(z.undefined()) }),
  failedFicheAnalysisSchema
    .pick({ ficheId: true, collectiviteId: true, status: true })
    .extend({ fingerprint: z.optional(z.undefined()) }),
]);

export type FicheAnalysisUpsert = z.output<typeof ficheAnalysisUpsertSchema>;

export abstract class FicheAnalysisStatusRepository {
  abstract listAnalyses(input: {
    readonly ficheIds: readonly number[];
  }): Promise<Result<FicheAnalysis[], FicheAnalysisStatusError>>;

  abstract listAnalysesOfAnalyzedCollectivites(): Promise<
    Result<FicheAnalysis[], FicheAnalysisStatusError>
  >;

  abstract upsertAnalyses(input: {
    readonly analyses: readonly FicheAnalysisUpsert[];
    readonly tx?: Transaction;
  }): Promise<Result<void, FicheAnalysisStatusError>>;

  abstract deleteAnalyses(input: {
    readonly ficheIds: readonly number[];
    readonly tx?: Transaction;
  }): Promise<Result<void, FicheAnalysisStatusError>>;
}
