import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDossiersInstructionErrorConfig } from './list-dossiers-instruction.errors';
import { listDossiersInstructionInputSchema } from './list-dossiers-instruction.input';
import { ListDossiersInstructionService } from './list-dossiers-instruction.service';

@Injectable()
export class ListDossiersInstructionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDossiersInstructionService: ListDossiersInstructionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDossiersInstructionErrorConfig
  );

  router = this.trpc.router({
    listDossiersInstruction: this.trpc.authedProcedure
      .input(listDossiersInstructionInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.listDossiersInstructionService.listDossiersInstruction(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
