import { createTrpcErrorHandler } from '@/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { listAxesErrorConfig } from './list-axes.errors';
import { listAxesInputSchema } from './list-axes.input';
import { ListAxesService } from './list-axes.service';

@Injectable()
export class ListAxesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listAxesService: ListAxesService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(listAxesErrorConfig);

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listAxesInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listAxesService.listAxes(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
    listRecursively: this.trpc.authedProcedure
      .input(listAxesInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listAxesService.listAxesRecursively(
          input,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
