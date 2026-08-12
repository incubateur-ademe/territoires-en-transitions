import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getDiagnosticErrorConfig } from './get-diagnostic.errors';
import { getDiagnosticInputSchema } from './get-diagnostic.input';
import { GetDiagnosticService } from './get-diagnostic.service';

@Injectable()
export class GetDiagnosticRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDiagnosticService: GetDiagnosticService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getDiagnosticErrorConfig
  );

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(getDiagnosticInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.getDiagnosticService.getDiagnostic(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
