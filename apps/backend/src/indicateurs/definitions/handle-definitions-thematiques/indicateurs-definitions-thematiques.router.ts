
import { IndicateursDefinitionsThematiquesService } from '@/backend/indicateurs/definitions/handle-definitions-thematiques/indicateurs-definitions-thematiques.service';
import { isAuthenticatedUser } from '@/backend/users/index-domain';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class IndicateursDefinitionsThematiquesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateursDefinitionsThematiquesService
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
        return this.service.getIndicateurThematique({ ...input, user: ctx.user });
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
          user: ctx.user,
        });
      }),
  });
}
