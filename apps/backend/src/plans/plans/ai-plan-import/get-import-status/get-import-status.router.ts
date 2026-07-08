import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { aiPlanImportErrorConfig } from '../ai-plan-import.trpc-errors';
import {
  getCurrentImportInputSchema,
  getImportStatusInputSchema,
} from './get-import-status.input';
import { getImportStatusOutputSchema } from './get-import-status.output';
import { GetImportStatusService } from './get-import-status.service';

@Injectable()
export class GetImportStatusRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getImportStatusService: GetImportStatusService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    aiPlanImportErrorConfig
  );

  router = this.trpc.router({
    getAiImportStatus: this.trpc.authedProcedure
      .input(getImportStatusInputSchema)
      .output(getImportStatusOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.getImportStatusService.getStatus({
          jobId: input.jobId,
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),

    getCurrentAiImport: this.trpc.authedProcedure
      .input(getCurrentImportInputSchema)
      .output(getImportStatusOutputSchema.nullable())
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.getImportStatusService.getCurrentImport({
          collectiviteId: input.collectiviteId,
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
