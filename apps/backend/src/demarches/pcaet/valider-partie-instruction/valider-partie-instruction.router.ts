import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { validerPartieInstructionErrorConfig } from './valider-partie-instruction.errors';
import { validerPartieInstructionInputSchema } from './valider-partie-instruction.input';
import { ValiderPartieInstructionService } from './valider-partie-instruction.service';

@Injectable()
export class ValiderPartieInstructionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly validerPartieInstructionService: ValiderPartieInstructionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    validerPartieInstructionErrorConfig
  );

  router = this.trpc.router({
    validerPartieInstruction: this.trpc.authedProcedure
      .input(validerPartieInstructionInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.validerPartieInstructionService.validerPartieInstruction(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
