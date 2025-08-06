
import { upsertIndicateurDefinitionPiloteRequestSchema } from '@/backend/indicateurs/definitions/handle-definitions-pilotes/indicateurs-definitions-pilotes.request';
import { IndicateursDefinitionsPilotesService } from '@/backend/indicateurs/definitions/handle-definitions-pilotes/indicateurs-definitions-pilotes.service';
import { isAuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class IndicateursDefinitionsPilotesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateursDefinitionsPilotesService
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
        return this.service.getIndicateurPilotes({ ...input, user: ctx.user });
      }),
    upsert: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
          indicateurPilotes: upsertIndicateurDefinitionPiloteRequestSchema.array(),
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
