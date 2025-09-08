import { HandleDefinitionServicesService } from '@/backend/indicateurs/definitions/handle-definition-services/handle-definition-services.service';
import { isAuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class HandleDefinitionServicesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleDefinitionServicesService
  ) {}

  router = this.trpc.router({
    listServices: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
        })
      )
      .query(({ ctx, input }) => {
        return this.service.listIndicateurServices({
          ...input,
          user: ctx.user,
        });
      }),

    upsertServices: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
          indicateurServicesPilotesIds: z.number().array(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error(
            'Service role user cannot upsert indicateur service pilote'
          );
        }

        return this.service.upsertIndicateurServices({
          ...input,
          user: ctx.user,
        });
      }),
  });
}
