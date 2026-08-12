import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { setDiagnosticYearsErrorConfig } from './set-diagnostic-years.errors';
import { setDiagnosticYearsInputSchema } from './set-diagnostic-years.input';
import { SetDiagnosticYearsService } from './set-diagnostic-years.service';

@Injectable()
export class SetDiagnosticYearsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setDiagnosticYearsService: SetDiagnosticYearsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    setDiagnosticYearsErrorConfig
  );

  router = this.trpc.router({
    setYears: this.trpc.authedProcedure
      .input(setDiagnosticYearsInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.setDiagnosticYearsService.setYears(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
