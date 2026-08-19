import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
    addPreuveComplementaireInputSchema,
    addPreuveReglementaireInputSchema,
} from './add-preuve.input';
import { addPreuveOutputSchema } from './add-preuve.output';
import { AddPreuveService } from './add-preuve.service';

@Injectable()
export class AddPreuveRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addPreuveService: AddPreuveService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    addPreuveReglementaire: this.trpc.authedProcedure
      .input(addPreuveReglementaireInputSchema)
      .output(addPreuveOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.addPreuveService.addPreuveReglementaire(
          input,
          user
        );
        return this.getResultDataOrThrowError(result);
      }),
    addPreuveComplementaire: this.trpc.authedProcedure
      .input(addPreuveComplementaireInputSchema)
      .output(addPreuveOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.addPreuveService.addPreuveComplementaire(
          input,
          user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}