import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { setDiagnosticReferenceYearErrorConfig } from './set-diagnostic-reference-year.errors';
import { setDiagnosticReferenceYearInputSchema } from './set-diagnostic-reference-year.input';
import { SetDiagnosticReferenceYearService } from './set-diagnostic-reference-year.service';

@Injectable()
export class SetDiagnosticReferenceYearRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    setDiagnosticReferenceYearErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: SetDiagnosticReferenceYearService
  ) {}

  router = this.trpc.router({
    setReferenceYear: this.trpc.authedProcedure
      .input(setDiagnosticReferenceYearInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.setReferenceYear(input, {
          user: ctx.user,
        });

        return this.getResultDataOrThrowError(result);
      }),
  });
}
