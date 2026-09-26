import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { AnalysisRunError } from './analyze-fiches.errors';

export abstract class AnalysisRunRepository {
  abstract getLastCompletedRunStart(): Promise<
    Result<Date | null, AnalysisRunError>
  >;

  abstract createCompletedRun(input: {
    readonly startedAt: Date;
    readonly tx?: Transaction;
  }): Promise<Result<void, AnalysisRunError>>;
}
