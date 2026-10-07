import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getDossierInstructionErrorConfig } from './get-dossier-instruction.errors';
import { getDossierInstructionInputSchema } from './get-dossier-instruction.input';
import { GetDossierInstructionService } from './get-dossier-instruction.service';

@Injectable()
export class GetDossierInstructionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDossierInstructionService: GetDossierInstructionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getDossierInstructionErrorConfig
  );

  router = this.trpc.router({
    getDossierInstruction: this.trpc.authedProcedure
      .input(getDossierInstructionInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.getDossierInstructionService.getDossierInstruction(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
