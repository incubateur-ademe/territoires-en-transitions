import { IndicateurDefinitionThematiqueService } from '@/backend/indicateurs/definitions/handle-definition-thematique/indicateur-definition-thematique.service';
import { isAuthenticatedUser } from '@/backend/users/index-domain';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class IndicateurDefinitionThematiqueRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurDefinitionThematiqueService
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
        return this.service.getIndicateurThematique({ ...input, tokenInfo: ctx.user });
      }),
    upsert: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
          indicateurThematiqueIds: z.number().array(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error('Service role user cannot upsert indicateur thematique');
        }

        return this.service.upsertIndicateurThematique({
          ...input,
          tokenInfo: ctx.user,
        });
      }),
  });
}
