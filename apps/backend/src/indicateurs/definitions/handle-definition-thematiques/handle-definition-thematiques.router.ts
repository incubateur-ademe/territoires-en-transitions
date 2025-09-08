import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { isAuthenticatedUser } from '../../../users/models/auth.models';
import { HandleDefinitionThematiquesService } from './handle-definition-thematiques.service';

@Injectable()
export class HandleDefinitionThematiquesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleDefinitionThematiquesService
  ) {}

  router = this.trpc.router({
    listThematiques: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
        })
      )
      .query(({ ctx, input }) => {
        return this.service.listIndicateurThematiques({
          ...input,
          user: ctx.user,
        });
      }),
    upsertThematiques: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          collectiviteId: z.number(),
          indicateurThematiqueIds: z.number().array(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error(
            'Service role user cannot upsert indicateur thematique'
          );
        }

        return this.service.upsertIndicateurThematiques({
          ...input,
          user: ctx.user,
        });
      }),
  });
}
