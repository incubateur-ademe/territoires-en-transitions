import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { aiPlanImportErrorConfig } from '../ai-plan-import.trpc-errors';
import { findPreviousImportInputSchema } from './find-previous-import.input';
import { findPreviousImportOutputSchema } from './find-previous-import.output';
import { FindPreviousImportService } from './find-previous-import.service';

@Injectable()
export class FindPreviousImportRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly findPreviousImportService: FindPreviousImportService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    aiPlanImportErrorConfig
  );

  router = this.trpc.router({
    findPreviousAiImport: this.trpc.authedProcedure
      .input(findPreviousImportInputSchema)
      .output(findPreviousImportOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.findPreviousImportService.findPreviousImport(
          input,
          { user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
