import { Injectable } from '@nestjs/common';
import {
  getScopeOrThrow,
  ScopeFactory,
} from '@tet/backend/authorizations/scope-factory.service';
import { PersonneTagService } from '@tet/backend/collectivites/tags/personnes/personne-tag.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';

@Injectable()
export class PersonneTagRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: PersonneTagService,
    private readonly scopeFactory: ScopeFactory
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
        const scope = getScopeOrThrow(
          await this.scopeFactory.fromAuthenticatedUser(ctx.user)
        );
        return this.service.convertTagsToUser({
          scope,
          userId: input.userId,
          tagIds: input.tagIds,
          collectiviteId: input.collectiviteId,
        });
      }),

    list: this.trpc.authedProcedure
      .input(
        z.object({
          collectiviteId: z.number(),
          tagIds: z.number().array().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const scope = getScopeOrThrow(
          await this.scopeFactory.fromAuthenticatedUser(ctx.user)
        );
        return this.service.listPersonneTags({
          scope,
          collectiviteId: input.collectiviteId,
          tagIds: input.tagIds ?? [],
        });
      }),
  });
}
