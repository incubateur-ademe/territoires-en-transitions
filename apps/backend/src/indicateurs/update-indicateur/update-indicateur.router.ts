import { updateIndicateurRequestSchema } from '@/backend/indicateurs/update-indicateur/update-indicateur.request';
import { UpdateIndicateurService } from '@/backend/indicateurs/update-indicateur/update-indicateur.service';
import { isAuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class UpdateIndicateurRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateIndicateurService
  ) { }

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          indicateurFields: updateIndicateurRequestSchema,
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
