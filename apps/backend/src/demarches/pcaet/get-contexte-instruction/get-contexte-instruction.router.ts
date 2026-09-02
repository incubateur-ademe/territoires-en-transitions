import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getContexteInstructionInputSchema } from './get-contexte-instruction.input';
import { GetContexteInstructionService } from './get-contexte-instruction.service';

@Injectable()
export class GetContexteInstructionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getContexteInstructionService: GetContexteInstructionService
  ) {}

  router = this.trpc.router({
    getContexteInstruction: this.trpc.authedProcedure
      .input(getContexteInstructionInputSchema)
      .query(async ({ input, ctx }) => {
        // Pas de gestion d'erreur : « cette collectivité n'est pas instruite par
        // toi » est une réponse (`null`), pas un refus.
        return this.getContexteInstructionService.getContexteInstruction(input, {
          user: ctx.user,
        });
      }),
  });
}
