import { IndicateurDefinitionServiceTagService } from '@/backend/indicateurs/definitions/handle-definition-service-tag/indicateur-definition-service-tag.service';
import { isAuthenticatedUser } from '@/backend/users/index-domain';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class IndicateurDefinitionServiceTagRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurDefinitionServiceTagService
  ) { }

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
        })
      )
      .query(({ ctx, input }) => {
        return this.service.getIndicateurServicesPilotes({ ...input, tokenInfo: ctx.user });
      }),
    upsert: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
          indicateurServicesPilotesIds: z.number().array(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error('Service role user cannot upsert indicateur service pilote');
        }

        return this.service.upsertIndicateurServicePilote({
          ...input,
          tokenInfo: ctx.user,
        });
      }),
  });
}
