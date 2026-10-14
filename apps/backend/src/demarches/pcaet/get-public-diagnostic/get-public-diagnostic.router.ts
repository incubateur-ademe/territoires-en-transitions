import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPublicDiagnosticErrorConfig } from './get-public-diagnostic.errors';
import { getPublicDiagnosticInputSchema } from './get-public-diagnostic.input';
import { GetPublicDiagnosticService } from './get-public-diagnostic.service';

@Injectable()
export class GetPublicDiagnosticRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getPublicDiagnosticService: GetPublicDiagnosticService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getPublicDiagnosticErrorConfig
  );

  router = this.trpc.router({
    getPublicDiagnostic: this.trpc.authedProcedure
      .input(getPublicDiagnosticInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.getPublicDiagnosticService.getPublicDiagnostic(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
