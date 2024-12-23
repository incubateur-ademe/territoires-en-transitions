import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import ListCategoriesService from './list-categories.service';

const inputSchema = z.object({
  collectiviteId: z.number(),
  withPredefinedTags: z.boolean().default(true),
});

@Injectable()
export class ListCategoriesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListCategoriesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(inputSchema)
      .query(({ ctx, input }) => {
        const { collectiviteId, withPredefinedTags } = input;
        return this.service.listCategories(
          collectiviteId,
          withPredefinedTags,
          ctx.user
        );
      }),
  });
}
