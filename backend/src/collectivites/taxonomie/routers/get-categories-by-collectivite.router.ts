import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import TagService from '../services/tag.service';
import { TrpcService } from '../../trpc/trpc.service';

const inputSchema = z.object({
  collectiviteId: z.number(),
  withPredefinedTags : z.boolean().default(true)
});

@Injectable()
export class GetCategoriesByCollectiviteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: TagService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(inputSchema)
      .query(({ ctx, input }) => {
        const { collectiviteId, withPredefinedTags } = input;
        return this.service.getCategoriesByCollectivite(collectiviteId, withPredefinedTags, ctx.user);
      }),
  });
}
