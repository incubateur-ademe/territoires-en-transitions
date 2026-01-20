import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { createLabellisationPreuveErrorConfig } from '../create-preuve/create-labellisation-preuve.errors';
import { listPreuveLabellisationInputSchema } from './list-preuve.input';
import { ListPreuveService } from './list-preuve.service';

@Injectable()
export class ListPreuveRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPreuveService: ListPreuveService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    createLabellisationPreuveErrorConfig
  );

  router = this.trpc.router({
    listPreuvesLabellisation: this.trpc.authedProcedure
      .input(listPreuveLabellisationInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.listPreuveService.listPreuvesLabellisation(
          input,
          user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
