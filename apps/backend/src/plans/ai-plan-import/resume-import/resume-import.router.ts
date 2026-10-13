import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { aiPlanImportErrorConfig } from '../ai-plan-import.trpc-errors';
import {
  findResumableImportInputSchema,
  resumeImportInputSchema,
} from './resume-import.input';
import { ResumeImportService } from './resume-import.service';

@Injectable()
export class ResumeImportRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly resumeImportService: ResumeImportService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    aiPlanImportErrorConfig
  );

  router = this.trpc.router({
    findResumableAiImport: this.trpc.authedProcedure
      .input(findResumableImportInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.resumeImportService.findResumable(input, {
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),

    resumeAiImport: this.trpc.authedProcedure
      .input(resumeImportInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.resumeImportService.resume(input, { user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
