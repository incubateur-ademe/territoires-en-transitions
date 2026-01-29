import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { mutateTagErrorConfig } from './mutate-tag.errors';
import {
  createTagInputSchema,
  deleteTagInputSchema,
  updateTagInputSchema,
} from './mutate-tag.input';
import { MutateTagService } from './mutate-tag.service';

@Injectable()
export class MutateTagRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly mutateTagService: MutateTagService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(mutateTagErrorConfig);

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createTagInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.mutateTagService.createTag(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),

    update: this.trpc.authedProcedure
      .input(updateTagInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.mutateTagService.updateTag(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),

    delete: this.trpc.authedProcedure
      .input(deleteTagInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.mutateTagService.deleteTag(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
