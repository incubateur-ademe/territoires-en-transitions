import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { mutateAxeErrorConfig } from './mutate-axe.errors';
import { mutateAxeSchema } from './mutate-axe.input';
import { MutateAxeService } from './mutate-axe.service';

@Injectable()
export class MutateAxeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly mutateAxeService: MutateAxeService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(mutateAxeErrorConfig);

  router = this.trpc.router({
    upsert: this.trpc.authedProcedure
      .input(mutateAxeSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.mutateAxeService.mutateAxe(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
