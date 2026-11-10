import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { CompleterEtapeDemoService } from './completer-etape-demo.service';
import { demarchePcaetDemoErrorConfig } from './demo.errors';
import {
  completerEtapeDemoInputSchema,
  simulerInstructionDemoInputSchema,
} from './demo.input';
import { SimulerInstructionDemoService } from './simuler-instruction-demo.service';

/**
 * Raccourcis du mode démo (collectivité de test et super admin) : chaque
 * service revérifie le double verrou, le front ne fait que les proposer.
 */
@Injectable()
export class DemarchePcaetDemoRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly completerEtapeService: CompleterEtapeDemoService,
    private readonly simulerInstructionService: SimulerInstructionDemoService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    demarchePcaetDemoErrorConfig
  );

  router = this.trpc.router({
    completerEtape: this.trpc.authedProcedure
      .input(completerEtapeDemoInputSchema)
      .mutation(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.completerEtapeService.completer(input, { user: ctx.user })
        )
      ),
    simulerAvis: this.trpc.authedProcedure
      .input(simulerInstructionDemoInputSchema)
      .mutation(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.simulerInstructionService.simulerAvis(input, {
            user: ctx.user,
          })
        )
      ),
    reputerFavorable: this.trpc.authedProcedure
      .input(simulerInstructionDemoInputSchema)
      .mutation(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.simulerInstructionService.reputerFavorable(input, {
            user: ctx.user,
          })
        )
      ),
  });
}
