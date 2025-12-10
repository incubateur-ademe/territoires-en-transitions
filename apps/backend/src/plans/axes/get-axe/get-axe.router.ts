import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getAxeErrorConfig } from './get-axe.errors';
import { getAxeInputSchema } from './get-axe.input';
import { GetAxeService } from './get-axe.service';

@Injectable()
export class GetAxeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getAxeService: GetAxeService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(getAxeErrorConfig);

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(getAxeInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.getAxeService.getAxe(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
