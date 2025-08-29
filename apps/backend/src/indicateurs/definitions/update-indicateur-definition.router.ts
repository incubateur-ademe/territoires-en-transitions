import { updateIndicateurDefinitionRequestSchema } from '@/backend/indicateurs/definitions/update-indicateur-definition.request';
import { UpdateIndicateurDefinitionService } from '@/backend/indicateurs/definitions/update-indicateur-definition.service';
import { isAuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class UpdateIndicateurRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateIndicateurDefinitionService
  ) { }

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          indicateurFields: updateIndicateurDefinitionRequestSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error('Service role user cannot update indicateur');
        }

        return this.service.updateIndicateur({
          ...input,
          tokenInfo: ctx.user,
        });
      }),
  });
}
