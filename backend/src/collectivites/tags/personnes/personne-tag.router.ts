import { PersonneTagService } from '@/backend/collectivites/tags/personnes/personne-tag.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class PersonneTagRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: PersonneTagService
  ) {}

  router = this.trpc.router({
    convertToUser: this.trpc.authedProcedure
      .input(
        z.object({
          userId: z.string(),
          tagIds: z.number().array(),
          collectiviteId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return this.service.convertTagsToUser(
          input.userId,
          input.tagIds,
          input.collectiviteId,
          ctx.user
        );
      }),

    list: this.trpc.authedProcedure
      .input(
        z.object({
          collectiviteId: z.number(),
          tagIds: z.number().array().optional(),
        })
      )
      .query(({ ctx, input }) => {
        return this.service.listPersonneTags(
          input.collectiviteId,
          input.tagIds ?? [],
          ctx.user
        );
      }),
  });
}
