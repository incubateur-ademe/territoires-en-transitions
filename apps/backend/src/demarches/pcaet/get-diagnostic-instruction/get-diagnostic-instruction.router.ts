import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getDiagnosticInstructionErrorConfig } from './get-diagnostic-instruction.errors';
import { getDiagnosticInstructionInputSchema } from './get-diagnostic-instruction.input';
import { GetDiagnosticInstructionService } from './get-diagnostic-instruction.service';

@Injectable()
export class GetDiagnosticInstructionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDiagnosticInstructionService: GetDiagnosticInstructionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getDiagnosticInstructionErrorConfig
  );

  router = this.trpc.router({
    getDiagnosticInstruction: this.trpc.authedProcedure
      .input(getDiagnosticInstructionInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.getDiagnosticInstructionService.getDiagnosticInstruction(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
