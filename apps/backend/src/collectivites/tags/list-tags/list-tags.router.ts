import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listTagsErrorConfig } from './list-tags.errors';
import { listTagsInputSchema } from './list-tags.input';
import { ListTagsService } from './list-tags.service';

@Injectable()
export class ListTagsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listTagsService: ListTagsService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(listTagsErrorConfig);

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listTagsInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listTagsService.listTags(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
