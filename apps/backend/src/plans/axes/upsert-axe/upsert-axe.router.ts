import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { upsertAxeErrorConfig } from './upsert-axe.errors';
import { createAxeSchema, updateAxeSchema } from './upsert-axe.input';
import { UpsertAxeService } from './upsert-axe.service';

@Injectable()
export class UpsertAxeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly upsertAxeService: UpsertAxeService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(upsertAxeErrorConfig);

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createAxeSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.upsertAxeService.upsertAxe(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
    update: this.trpc.authedProcedure
      .input(updateAxeSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.upsertAxeService.upsertAxe(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
