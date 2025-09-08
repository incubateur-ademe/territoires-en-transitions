import { upsertIndicateurDefinitionPiloteRequestSchema } from '@/backend/indicateurs/definitions/handle-definition-pilotes/handle-definition-pilotes.request';
import { HandleDefinitionPilotesService } from '@/backend/indicateurs/definitions/handle-definition-pilotes/handle-definition-pilotes.service';
import { isAuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class HandleDefinitionPilotesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleDefinitionPilotesService
  ) {}

  router = this.trpc.router({
    listPilotes: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
        })
      )
      .query(({ ctx, input }) => {
        return this.service.listIndicateurPilotes({ ...input, user: ctx.user });
      }),

    upsertPilotes: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
          indicateurPilotes:
            upsertIndicateurDefinitionPiloteRequestSchema.array(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error('Service role user cannot upsert indicateur pilote');
        }

        return this.service.upsertIndicateurPilote({
          ...input,
          user: ctx.user,
        });
      }),
  });
}
