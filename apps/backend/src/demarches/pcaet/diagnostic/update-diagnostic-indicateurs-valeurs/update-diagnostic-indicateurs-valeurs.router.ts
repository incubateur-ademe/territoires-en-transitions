import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { updateDiagnosticIndicateursValeursErrorConfig } from './update-diagnostic-indicateurs-valeurs.errors';
import { updateDiagnosticIndicateursValeursInputSchema } from './update-diagnostic-indicateurs-valeurs.input';
import { UpdateDiagnosticIndicateursValeursService } from './update-diagnostic-indicateurs-valeurs.service';

@Injectable()
export class UpdateDiagnosticIndicateursValeursRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateDiagnosticIndicateursValeursErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateDiagnosticIndicateursValeursService
  ) {}

  router = this.trpc.router({
    updateValeurs: this.trpc.authedProcedure
      .input(updateDiagnosticIndicateursValeursInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.updateValeurs(input, {
          user: ctx.user,
        });

        return this.getResultDataOrThrowError(result);
      }),
  });
}
