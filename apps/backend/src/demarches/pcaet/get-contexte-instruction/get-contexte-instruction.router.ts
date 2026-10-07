import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getContexteInstructionErrorConfig } from './get-contexte-instruction.errors';
import { getContexteInstructionInputSchema } from './get-contexte-instruction.input';
import { GetContexteInstructionService } from './get-contexte-instruction.service';

@Injectable()
export class GetContexteInstructionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getContexteInstructionService: GetContexteInstructionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getContexteInstructionErrorConfig
  );

  router = this.trpc.router({
    getContexteInstruction: this.trpc.authedProcedure
      .input(getContexteInstructionInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.getContexteInstructionService.getContexteInstruction(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
