import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { createLabellisationPreuveErrorConfig } from './create-labellisation-preuve.errors';
import { createLabellisationPreuveInputSchema } from './create-labellisation-preuve.input';
import { CreatePreuveService } from './create-preuve.service';

@Injectable()
export class CreatePreuveRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly createPreuveService: CreatePreuveService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    createLabellisationPreuveErrorConfig
  );

  router = this.trpc.router({
    createLabellisationPreuve: this.trpc.authedProcedure
      .input(createLabellisationPreuveInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.createPreuveService.createLabellisationPreuve(
          input,
          user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
