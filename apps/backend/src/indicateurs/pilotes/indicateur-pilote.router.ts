import { upsertIndicateurPiloteRequestSchema } from '@/backend/indicateurs/pilotes/indicateur-pilote.request';
import { IndicateurPiloteService } from '@/backend/indicateurs/pilotes/indicateur-pilote.service';
import { isAuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class IndicateurPiloteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurPiloteService
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
        return this.service.getIndicateurPilotes({ ...input, tokenInfo: ctx.user });
      }),
    upsert: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
          indicateurPilotes: upsertIndicateurPiloteRequestSchema.array(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error('Service role user cannot upsert indicateur pilote');
        }

        return this.service.upsertIndicateurPilote({
          ...input,
          tokenInfo: ctx.user,
        });
      }),
  });
}
